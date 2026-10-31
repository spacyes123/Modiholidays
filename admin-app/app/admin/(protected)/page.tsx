import Link from "next/link";
import { employee } from "@/lib/supabase";
import { inr } from "@/lib/pricing";
export default async function Dashboard() {
  const { db } = await employee();
  const { data, error } = await db.rpc("dashboard_overview");
  if (error || !data)
    throw Error(
      "Could not load private metrics. Apply migrations and verify access.",
    );
  const metrics = [
    ["Total enquiries", data.metrics.total_enquiries],
    ["New enquiries", data.metrics.new_enquiries],
    ["Quotations pending", data.metrics.pending_quotes],
    ["Quotations sent", data.metrics.sent_quotes],
    ["Confirmed bookings", data.metrics.confirmed_bookings],
    ["Confirmed value", inr(data.metrics.confirmed_value)],
    ["Expected gross profit", inr(data.metrics.expected_profit)],
    ["Upcoming departures", data.metrics.upcoming_departures],
    ["Customer balance due", inr(data.metrics.balance_due)],
  ] as [string, string | number][];
  const enquiries = data.recent as {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];
  const upcoming = data.upcoming as {
    id: string;
    title: string;
    status: string;
  }[];
  const followups = data.followups as {
    id: string;
    title: string;
    status: string;
  }[];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your operations, in focus</p>
          <h1>Today at Modi Holidays</h1>
          <p>
            Live records from your private database. Expected profit is an
            estimate, not realised income.
          </p>
        </div>
        <Link className="button" href="/admin/enquiries/new">
          + New enquiry
        </Link>
      </div>
      <div className="metric-grid">
        {metrics.map(([label, v]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <strong>{v}</strong>
          </article>
        ))}
      </div>
      <div className="quick-actions">
        <Link href="/admin/enquiries/new">New enquiry ↗</Link>
        <Link href="/admin/itineraries/new">Create itinerary ↗</Link>
        <Link href="/admin/quotations/new">Create quotation ↗</Link>
        <Link href="/admin/bookings">View bookings ↗</Link>
      </div>
      <div className="dashboard-grid">
        {[
          ["Recent enquiries", enquiries, "enquiries"],
          ["Upcoming departures", upcoming.slice(0, 8), "bookings"],
          ["Pending follow-ups", followups.slice(0, 8), "enquiries"],
        ].map(([title, rows, module]) => (
          <section className="panel" key={String(title)}>
            <h2>{String(title)}</h2>
            {(rows as { id: string; title: string; status: string }[])
              .length ? (
              (rows as { id: string; title: string; status: string }[]).map(
                (r) => (
                  <Link
                    className="list-row"
                    href={"/admin/" + module + "/" + r.id}
                    key={r.id}
                  >
                    <span>{r.title}</span>
                    <span className="badge">{r.status}</span>
                  </Link>
                ),
              )
            ) : (
              <p className="empty">No actual records yet.</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
