import { apiEmployee } from "@/lib/supabase";
import { approvedPdf } from "@/lib/pdf-service";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await apiEmployee();
  if (!access) return Response.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const id = z.uuid().parse((await params).id);
    const { bytes, snapshot } = await approvedPdf(access.db, id);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${snapshot.reference}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 400 },
    );
  }
}
