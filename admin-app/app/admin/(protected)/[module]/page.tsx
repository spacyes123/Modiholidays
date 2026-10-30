import Link from "next/link";
import { notFound } from "next/navigation";
import { modules, records, type Module } from "@/lib/data";
import { employee } from "@/lib/supabase";
import { SettingsForm } from "@/components/forms";
export default async function ModuleList({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ q?: string; status?: string; followup?: string }>;
}) {
  const { module } = await params;
  if (!modules.includes(module as Module)) notFound();
  const query = await searchParams;
  if (module === "settings") {
    const { db, profile } = await employee();
    const { data, error } = await db
      .from("operations_settings")
      .select("*")
      .single();
    if (error) throw Error("Settings unavailable");
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Private configuration</p>
            <h1>Operations settings</h1>
          </div>
        </div>
        <section className="panel">
          {profile.role === "admin" ? (
            <SettingsForm
              margin={String(data.minimum_margin)}
              email={data.company_email}
            />
          ) : (
            <p>
              Only an administrator can update pricing and account settings.
            </p>
          )}
          <h2>Employee accounts</h2>
          <p>
            Provision employees in Supabase Auth, then add their UUID to
            admin_profiles. There is no public registration. Deactivate their
            profile to revoke application access.
          </p>
          <h2>Business contact</h2>
          <p>
            WhatsApp: +91 7666018401. Email sharing is enabled only when an
            authenticated provider is configured on the server.
          </p>
        </section>
        {profile.role === "admin" && (
          <section className="panel">
            <h2>Latest audit events</h2>
            {(await records("audit_logs")).slice(0, 30).map((r) => (
              <p className="small" key={r.id}>
                {String(r.created_at)} · {String(r.entity)} · {String(r.action)}{" "}
                · {String(r.actor || "Website ingress")}
              </p>
            ))}
          </section>
        )}
      </>
    );
  }
  const rows = await records(
    module === "quotations" ? "quotation_overview" : module,
  );
  const filtered = rows.filter(
    (r) =>
      (!query.q ||
        [r.title, r.name, r.reference, JSON.stringify(r.details)]
          .join(" ")
          .toLowerCase()
          .includes(query.q.toLowerCase())) &&
      (!query.status || r.status === query.status) &&
      (query.followup !== "due" ||
        (r.follow_up &&
          String(r.follow_up) <= new Date().toISOString().slice(0, 10) &&
          !["Lost", "Confirmed"].includes(r.status || ""))),
  );
  const statuses = [...new Set(rows.map((r) => r.status).filter(Boolean))];
  const canCreate = [
    "enquiries",
    "itineraries",
    "quotations",
    "suppliers",
  ].includes(module);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Modi Holidays workspace</p>
          <h1>{module.charAt(0).toUpperCase() + module.slice(1)}</h1>
          <p>{filtered.length} visible records</p>
        </div>
        {canCreate && (
          <Link className="button" href={"/admin/" + module + "/new"}>
            + New {module === "enquiries" ? "enquiry" : module.slice(0, -1)}
          </Link>
        )}
      </div>
      <form className="filters">
        <label>
          Search
          <input
            name="q"
            type="search"
            defaultValue={query.q}
            placeholder="Customer, reference or destination"
          />
        </label>
        {statuses.length > 0 && (
          <label>
            Status
            <select name="status" defaultValue={query.status || ""}>
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <button className="secondary">Apply filters</button>
        <Link href={"/admin/" + module}>Reset</Link>
      </form>
      <section className="panel">
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Reference</th>
                  <th>Status / category</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={"/admin/" + module + "/" + r.id}>
                        {r.title || r.name}
                      </Link>
                    </td>
                    <td>{r.reference || r.id.slice(0, 8)}</td>
                    <td>
                      <span className="badge">
                        {r.status || String(r.category || "Draft")}
                      </span>
                    </td>
                    <td>
                      {String(r.updated_at || r.created_at || "").slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <h2>No records found</h2>
            <p>
              No invented enquiries, rates or bookings are displayed.{" "}
              {module === "bookings"
                ? "Convert an approved quotation to create a booking."
                : "Create a record or adjust your filters."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
