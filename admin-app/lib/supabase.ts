import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export function configured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
export async function database() {
  if (!configured()) throw Error("Supabase is not configured.");
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              store.set(name, value, {
                ...options,
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              }),
            );
          } catch {
            /* Server components cannot write cookies; proxy refreshes sessions. */
          }
        },
      },
    },
  );
}
export async function employee() {
  if (!configured()) redirect("/admin/login?setup=required");
  const db = await database();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const { data: profile } = await db
    .from("admin_profiles")
    .select("id,display_name,role,active")
    .eq("id", user.id)
    .eq("active", true)
    .single();
  if (!profile) redirect("/admin/login?error=access");
  return {
    db,
    user,
    profile: profile as {
      id: string;
      display_name: string;
      role: "admin" | "staff";
      active: boolean;
    },
  };
}
export async function apiEmployee() {
  if (!configured()) return null;
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db
    .from("admin_profiles")
    .select("id,display_name,role")
    .eq("id", user.id)
    .eq("active", true)
    .single();
  return profile ? { db, user, profile } : null;
}
