import { apiEmployee } from "@/lib/supabase";
import { approvedPdf } from "@/lib/pdf-service";
import { inr } from "@/lib/pricing";
import { z } from "zod";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const access = await apiEmployee();
  if (!access) return Response.json({ error: "Unauthorised" }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.QUOTE_FROM_EMAIL)
    return Response.json(
      {
        error:
          "Authenticated email service is not configured. Download and share the PDF manually.",
      },
      { status: 503 },
    );
  try {
    const id = z.uuid().parse((await params).id);
    const { bytes, snapshot } = await approvedPdf(access.db, id);
    if (
      snapshot.valid_until <
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
        new Date(),
      )
    )
      throw Error(
        "Quotation validity expired. Create and approve a new version before sending.",
      );
    const recipient = z.email().parse(snapshot.customer.email);
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": "modi-quote-" + id,
      },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL,
        to: [recipient],
        subject: `${snapshot.reference} · ${snapshot.title}`,
        text: `Dear ${snapshot.customer.name},\n\nPlease find your Modi Holidays quotation attached. Total: ${inr(snapshot.price)}. Valid until ${snapshot.valid_until}. Pricing and availability remain subject to written confirmation.\n\nModi Holidays\n+91 7666018401`,
        attachments: [
          {
            filename: snapshot.reference + ".pdf",
            content: bytes.toString("base64"),
          },
        ],
      }),
    });
    if (!result.ok)
      throw Error(
        "Email provider did not accept the message; delivery is not confirmed.",
      );
    const body = await result.json();
    const { error } = await access.db.rpc("mark_quote", {
      p_id: id,
      p_status: "Sent",
    });
    if (error)
      return Response.json(
        {
          message:
            "Email accepted by provider " +
            String(body.id) +
            ", but status recording failed. Check the provider before retrying.",
        },
        { status: 202 },
      );
    return Response.json({
      message:
        "Email accepted by the provider. Delivery is not guaranteed; check provider delivery logs.",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Email failed" },
      { status: 400 },
    );
  }
}
