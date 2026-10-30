import Link from "next/link";
import { employee } from "@/lib/supabase";
import { logout } from "@/lib/actions";
import { modules } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await employee();
  return (
    <div className="workspace">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/admin" className="brand-panel">
          <img
            src="/assets/brand/logo-256.png"
            alt="Modi Holidays"
            width="128"
            height="128"
          />
        </Link>
        <p className="eyebrow">Travel operations</p>
        <nav aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          {modules.map((m) => (
            <Link key={m} href={"/admin/" + m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          Private workspace
          <br />
          Customer details and supplier costs stay inside this workspace.
        </div>
      </aside>
      <div className="workspace-main">
        <header className="toolbar">
          <form action="/admin/enquiries" className="global-search">
            <label className="sr-only" htmlFor="global-search">
              Find an enquiry
            </label>
            <input
              id="global-search"
              name="q"
              type="search"
              placeholder="Search customer or destination…"
            />
          </form>
          <Link
            href="/admin/enquiries?followup=due"
            aria-label="Due follow-ups"
          >
            Follow-ups
          </Link>
          <span>
            {profile.display_name}
            <small>{profile.role}</small>
          </span>
          <form action={logout}>
            <button className="quiet" type="submit">
              Log out
            </button>
          </form>
        </header>
        <main id="content">{children}</main>
      </div>
    </div>
  );
}
