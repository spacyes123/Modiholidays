import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { z } from "zod";
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().regex(/^[+0-9() .-]{7,30}$/),
  email: z.email().or(z.literal("")),
  destination: z.string().trim().min(1).max(240),
  departureCity: z.string().trim().min(1).max(100),
  travelDates: z.string().max(100),
  adults: z.coerce.number().int().min(1).max(100),
  children: z.coerce.number().int().min(0).max(100),
  budget: z.string().max(100),
  preferences: z.string().max(1200),
  idempotencyKey: z.uuid(),
  captchaToken: z.string().min(1).max(4096),
  website: z.literal(""),
});
export async function POST(request: Request) {
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  if (
    request.headers.get("origin") !== origin ||
    new URL(request.url).origin !== origin
  )
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (
    !process.env.PUBLIC_ENQUIRY_SECRET ||
    !process.env.TURNSTILE_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return Response.json(
      { error: "Website intake is not configured. Continue with WhatsApp." },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length") || 0) > 20000)
    return Response.json({ error: "Request too large" }, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 20000) throw Error("Request too large");
    const data = schema.parse(JSON.parse(raw));
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: data.captchaToken,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const captcha = await verification.json();
    if (
      !captcha.success ||
      captcha.hostname !== new URL(origin).hostname ||
      captcha.action !== "enquiry"
    )
      return Response.json(
        { error: "Please complete the enquiry verification again." },
        { status: 400 },
      );
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const rateKey = createHmac("sha256", process.env.PUBLIC_ENQUIRY_SECRET)
      .update(ip)
      .digest("hex");
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false } },
    );
    const { error } = await db.rpc("receive_public_enquiry", {
      p_secret: process.env.PUBLIC_ENQUIRY_SECRET,
      p_key: data.idempotencyKey,
      p_rate_key: rateKey,
      p_data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        destination: data.destination,
        departureCity: data.departureCity,
        travelDates: data.travelDates,
        adults: data.adults,
        children: data.children,
        budget: data.budget,
        preferences: `Preferred dates: ${data.travelDates || "Flexible"}\n${data.preferences}`,
      },
    });
    if (error)
      throw Error(
        "The enquiry could not be saved. Continue with WhatsApp, or retry later.",
      );
    return Response.json(
      {
        ok: true,
        message:
          "Your enquiry was saved for the Modi Holidays team. A booking is not confirmed.",
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof z.ZodError
            ? "Please check your contact and traveller details."
            : error instanceof Error
              ? error.message
              : "Enquiry could not be saved.",
      },
      { status: 400 },
    );
  }
}
