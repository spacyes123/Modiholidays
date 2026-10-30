import { apiEmployee } from "@/lib/supabase";
export async function GET() {
  const access = await apiEmployee();
  return access
    ? Response.json({ ok: true, role: access.profile.role })
    : Response.json({ error: "Unauthorised" }, { status: 401 });
}
