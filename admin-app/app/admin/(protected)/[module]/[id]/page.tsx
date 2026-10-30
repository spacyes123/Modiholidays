import Link from "next/link";
import Decimal from "decimal.js";
import { notFound } from "next/navigation";
import { records, record, catalogueTemplates } from "@/lib/data";
import { employee } from "@/lib/supabase";
import { SaveForm, OperationButton, ActivityForm } from "@/components/forms";
import {
  enquiryFields,
  defaultEnquiry,
  supplierFields,
  defaultSupplier,
} from "@/lib/fields";
import ItineraryEditor from "@/components/itinerary-editor";
import QuoteEditor from "@/components/quote-editor";
import { emptyItinerary, emptyQuote } from "@/lib/defaults";
import { quoteSchema, type ItineraryInput } from "@/lib/schemas";
import { inr } from "@/lib/pricing";
import ShareQuote from "@/components/share-quote";
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ module: string; id: string }>;
  searchParams: Promise<{
    enquiry?: string;
    itinerary?: string;
    version?: string;
  }>;
}) {
  const { module, id } = await params;
  const query = await searchParams;
  if (
    ![
      "enquiries",
      "itineraries",
      "quotations",
      "bookings",
      "suppliers",
    ].includes(module)
  )
    notFound();
  const fresh = id === "new";
  const row = fresh ? null : await record(module, id);
  const { db, profile } = await employee();
  const title = fresh
    ? "New " + (module === "enquiries" ? "enquiry" : module.slice(0, -1))
    : row!.title || row!.name;
  let content: React.ReactNode;
  if (module === "enquiries") {
    const profiles = await records("admin_profiles");
    const fields = [
      ...enquiryFields,
      {
        key: "assigned_to",
        label: "Assigned staff",
        options: [
          { value: "", label: "Unassigned" },
          ...profiles
            .filter((p) => p.active)
            .map((p) => ({ value: p.id, label: String(p.display_name) })),
        ],
      },
    ];
    const data = row
      ? {
          ...defaultEnquiry,
          ...row.details,
          status: row.status,
          assigned_to: row.assigned_to || "",
          follow_up: row.follow_up || "",
          children_ages: Array.isArray(row.details.children_ages)
            ? row.details.children_ages.join(", ")
            : "",
        }
      : defaultEnquiry;
    const activities = fresh
      ? []
      : (await records("enquiry_activities")).filter(
          (a) => a.enquiry_id === id,
        );
    const itineraries = fresh
      ? []
      : (await records("itineraries")).filter((i) => i.enquiry_id === id);
    const quotes = fresh
      ? []
      : (await records("quotations")).filter((q) => q.enquiry_id === id);
    content = (
      <>
        <section className="panel">
          <SaveForm
            operation="enquiry"
            id={fresh ? undefined : id}
            initial={data}
            spec={fields}
            after="/admin/enquiries/:id"
          />
        </section>
        {!fresh && (
          <>
            <div className="quick-actions">
              <Link href={"/admin/itineraries/new?enquiry=" + id}>
                Convert to itinerary ↗
              </Link>
            </div>
            <div className="dashboard-grid">
              <section className="panel">
                <h2>Communication & follow-up history</h2>
                <ActivityForm enquiryId={id} />
                {activities.map((a) => (
                  <article className="activity" key={a.id}>
                    <strong>
                      {String(a.kind)} · {String(a.created_at).slice(0, 16)}
                    </strong>
                    <p>{String(a.body)}</p>
                  </article>
                ))}
              </section>
              <section className="panel">
                <h2>Linked itineraries</h2>
                {itineraries.map((i) => (
                  <Link
                    className="list-row"
                    key={i.id}
                    href={"/admin/itineraries/" + i.id}
                  >
                    {i.title}
                  </Link>
                ))}
                <h2>Linked quotations</h2>
                {quotes.map((q) => (
                  <Link
                    className="list-row"
                    key={q.id}
                    href={"/admin/quotations/" + q.id}
                  >
                    {q.title}
                  </Link>
                ))}
              </section>
            </div>
          </>
        )}
      </>
    );
  } else if (module === "itineraries") {
    const enquiries = await records("enquiries");
    const linked = enquiries.find(
      (e) => e.id === (row?.enquiry_id || query.enquiry),
    );
    const base = {
      ...emptyItinerary,
      ...(linked?.details || {}),
      enquiry_id: String(linked?.id || ""),
      title: "Custom " + String(linked?.details?.destinations || "holiday"),
      revision: 0,
      days: emptyItinerary.days,
    };
    const days = fresh
      ? base.days
      : (await records("itinerary_days"))
          .filter((d) => d.itinerary_id === id)
          .sort((a, b) => Number(a.position) - Number(b.position))
          .map((d) => d.details);
    const initial = (
      row
        ? {
            ...row.details,
            title: row.title,
            enquiry_id: row.enquiry_id,
            revision: row.revision,
            days,
          }
        : base
    ) as ItineraryInput;
    const templates = [
      ...catalogueTemplates(),
      ...(await records("itinerary_templates")).map((t) => ({
        id: t.id,
        title: String(t.title),
        destination: String(t.details.destinations || ""),
        days: (t.details.days || []) as ItineraryInput["days"],
      })),
    ];
    const revisions = fresh
      ? []
      : (await records("itinerary_revisions")).filter(
          (r) => r.itinerary_id === id,
        );
    content = (
      <>
        <ItineraryEditor
          key={id}
          id={fresh ? undefined : id}
          initial={initial}
          enquiries={enquiries.map((e) => ({
            id: e.id,
            title: String(e.title),
          }))}
          templates={templates}
        />
        {!fresh && (
          <>
            <Link
              className="button"
              href={"/admin/quotations/new?itinerary=" + id}
            >
              Create quotation for this itinerary
            </Link>
            <section className="panel">
              <h2>Saved revision history</h2>
              {revisions.map((r) => (
                <details key={r.id}>
                  <summary>
                    Revision {String(r.revision)} · {String(r.created_at)}
                  </summary>
                  <pre>{JSON.stringify(r.snapshot, null, 2)}</pre>
                </details>
              ))}
            </section>
          </>
        )}
      </>
    );
  } else if (module === "quotations") {
    const itineraries = await records("itineraries");
    if (fresh) {
      content = (
        <section className="panel">
          <SaveForm
            operation="quotation"
            initial={{
              title: "Custom holiday quotation",
              itinerary_id: query.itinerary || "",
            }}
            spec={[
              { key: "title", label: "Quotation title", required: true },
              {
                key: "itinerary_id",
                label: "Saved itinerary",
                required: true,
                options: [
                  { value: "", label: "Choose an itinerary" },
                  ...itineraries.map((i) => ({
                    value: i.id,
                    label: String(i.title),
                  })),
                ],
              },
            ]}
            after="/admin/quotations/:id"
          />
        </section>
      );
    } else {
      const itinerary = itineraries.find((i) => i.id === row!.itinerary_id);
      if (!itinerary) throw Error("Linked itinerary unavailable");
      const versions = (await records("quotation_versions"))
        .filter((v) => v.quotation_id === id)
        .sort((a, b) => Number(b.version) - Number(a.version));
      const selected =
        versions.find((v) => v.id === query.version) || versions[0];
      const rawCosts = (await records("quotation_cost_items"))
        .filter((c) => c.version_id === selected?.id)
        .map((c) => ({
          ...c,
          supplier_id: c.supplier_id || "",
          quantity: String(c.quantity),
          unit_cost: String(c.unit_cost),
          fx_rate: String(c.fx_rate),
          rate_valid_until: c.rate_valid_until || "",
        }));
      const costs = quoteSchema.shape.costs.parse(rawCosts);
      const suppliers = await records("suppliers"),
        rates = await records("supplier_rates");
      const { data: settings } = await db
        .from("operations_settings")
        .select("*")
        .single();
      const details = selected
        ? quoteSchema.parse({ ...emptyQuote, ...selected.details, costs })
        : emptyQuote;
      const travellers = {
        adults: Number(itinerary.details.adults),
        children: Number(itinerary.details.children || 0),
        infants: Number(itinerary.details.infants || 0),
      };
      content = (
        <>
          <section className="panel">
            <h2>Versions & alternatives</h2>
            <div className="version-tabs">
              {versions.map((v) => (
                <Link
                  className="button secondary"
                  key={v.id}
                  href={"/admin/quotations/" + id + "?version=" + v.id}
                >
                  V{String(v.version)} · {String(v.details.variant)} ·{" "}
                  {v.status}
                </Link>
              ))}
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Option</th>
                    <th>Status</th>
                    <th>Approved total</th>
                    <th>Expected profit</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id}>
                      <td>{String(v.version)}</td>
                      <td>{String(v.details.variant)}</td>
                      <td>{v.status}</td>
                      <td>
                        {v.totals
                          ? inr(
                              String(
                                (v.totals as Record<string, unknown>)
                                  .finalPrice,
                              ),
                            )
                          : "Draft — preview below"}
                      </td>
                      <td>
                        {v.totals
                          ? inr(
                              String(
                                (v.totals as Record<string, unknown>).profit,
                              ),
                            )
                          : "Not approved"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {selected?.approved_at ? (
            <>
              <section className="panel">
                <h2>Approved, locked customer quotation</h2>
                <p>
                  Version {String(selected.version)} is immutable. Create
                  another version for changes. Its customer snapshot and PDF
                  remain tied to this approval.
                </p>
                <ShareQuote
                  versionId={selected.id}
                  snapshot={selected.snapshot as Record<string, unknown>}
                  status={selected.status || ""}
                />
                <div className="inline-actions">
                  <OperationButton
                    label="Mark ready to send"
                    operation="mark"
                    input={{ id: selected.id, status: "Ready to send" }}
                  />
                  <OperationButton
                    label="Record as sent"
                    operation="mark"
                    input={{ id: selected.id, status: "Sent" }}
                    confirm="Record that you actually sent this quotation? This does not send a message."
                  />
                </div>
                <SaveForm
                  operation="booking"
                  initial={{ payment_due: "" }}
                  spec={[
                    {
                      key: "payment_due",
                      label: "Initial payment due date",
                      type: "date",
                      required: true,
                    },
                  ]}
                  extra={{ version_id: selected.id }}
                  after="/admin/bookings/:id"
                />
                <OperationButton
                  label="Duplicate into a new draft version"
                  operation="version"
                  input={{
                    quotation_id: id,
                    id: null,
                    revision: 0,
                    data: details,
                  }}
                  after={"/admin/quotations/" + id + "?version=:id"}
                />
              </section>
            </>
          ) : (
            <>
              <QuoteEditor
                key={selected?.id || "new"}
                quotationId={id}
                versionId={selected?.id}
                revision={Number(selected?.revision || 0)}
                initial={details}
                travellers={travellers}
                suppliers={suppliers.map((s) => ({
                  id: s.id,
                  name: String(s.name),
                }))}
                rates={rates}
                minimumMargin={String(settings?.minimum_margin || 10)}
              />
              {selected && profile.role === "admin" && (
                <section className="panel">
                  <h2>Admin approval</h2>
                  <p>
                    Save changes first. Approval recalculates pricing on the
                    database, checks margin, costs and validity, freezes the
                    customer snapshot and records an audit event.
                  </p>
                  <OperationButton
                    label="Approve saved quotation"
                    operation="approve"
                    input={{
                      id: selected.id,
                      revision: Number(selected.revision),
                    }}
                    confirm="Approve and lock this saved quotation version?"
                  />
                </section>
              )}
            </>
          )}
        </>
      );
    }
  } else if (module === "suppliers") {
    const rates = fresh
      ? []
      : (await records("supplier_rates")).filter((r) => r.supplier_id === id);
    content = (
      <>
        <section className="panel">
          <SaveForm
            operation="supplier"
            id={fresh ? undefined : id}
            initial={
              row ? { ...defaultSupplier, ...row.details } : defaultSupplier
            }
            spec={supplierFields}
            after="/admin/suppliers/:id"
          />
        </section>
        {!fresh && (
          <section className="panel">
            <h2>Editable recorded supplier rates</h2>
            <p>
              These are manual records, never live availability. Expired rates
              cannot be approved on quotations.
            </p>
            <SaveForm
              operation="rate"
              initial={{
                supplier_id: id,
                description: "",
                amount: "0",
                currency: "INR",
                valid_until: "",
                source: "",
                last_verified: "",
              }}
              spec={[
                {
                  key: "description",
                  label: "Rate description",
                  required: true,
                },
                { key: "amount", label: "Amount", required: true },
                { key: "currency", label: "Currency", required: true },
                {
                  key: "valid_until",
                  label: "Valid until",
                  type: "date",
                  required: true,
                },
                { key: "source", label: "Rate source", required: true },
                {
                  key: "last_verified",
                  label: "Verification date",
                  type: "date",
                  required: true,
                },
              ]}
            />
            {rates.map((r) => (
              <details key={r.id}>
                <summary>
                  {String(r.description)} · {String(r.currency)}{" "}
                  {String(r.amount)} · valid until {String(r.valid_until)} ·
                  Edit recorded rate
                </summary>
                <SaveForm
                  operation="rate"
                  id={r.id}
                  initial={{
                    supplier_id: id,
                    description: r.description,
                    amount: r.amount,
                    currency: r.currency,
                    valid_until: r.valid_until,
                    source: r.source,
                    last_verified: r.last_verified,
                  }}
                  spec={[
                    {
                      key: "description",
                      label: "Description",
                      required: true,
                    },
                    { key: "amount", label: "Amount", required: true },
                    { key: "currency", label: "Currency", required: true },
                    {
                      key: "valid_until",
                      label: "Valid until",
                      type: "date",
                      required: true,
                    },
                    { key: "source", label: "Rate source", required: true },
                    {
                      key: "last_verified",
                      label: "Last verification date",
                      type: "date",
                      required: true,
                    },
                  ]}
                />
              </details>
            ))}
          </section>
        )}
      </>
    );
  } else {
    if (!row) notFound();
    const payments = (await records("payments")).filter(
      (p) => p.booking_id === id,
    );
    const paid = payments.reduce(
      (s, p) => s.plus(String(p.amount)),
      new Decimal(0),
    );
    content = (
      <>
        <section className="panel">
          <h2>{row.reference}</h2>
          <dl>
            <div>
              <dt>Approved booking value</dt>
              <dd>{inr(String(row.value))}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{inr(paid.toFixed(2))}</dd>
            </div>
            <div>
              <dt>Outstanding</dt>
              <dd>
                {inr(new Decimal(String(row.value)).minus(paid).toFixed(2))}
              </dd>
            </div>
            <div>
              <dt>Travel dates</dt>
              <dd>
                {String(row.start_date || "Not set")} →{" "}
                {String(row.end_date || "Not set")}
              </dd>
            </div>
          </dl>
          <SaveForm
            operation="booking-state"
            initial={{
              status: row.status,
              confirmation: row.supplier_confirmation,
            }}
            spec={[
              {
                key: "status",
                label: "Booking state",
                options: [
                  "Pending",
                  "Advance Received",
                  "Supplier Confirmation",
                  "Confirmed",
                  "Completed",
                  "Cancelled",
                ].map((value) => ({ value, label: value })),
              },
              {
                key: "confirmation",
                label: "Actual supplier confirmation status",
                options: ["Pending", "Partial", "Confirmed"].map((value) => ({
                  value,
                  label: value,
                })),
              },
            ]}
            extra={{ id }}
          />
          <p className="notice">
            An advance never confirms a booking. Record actual supplier
            confirmation before moving to Confirmed.
          </p>
        </section>
        <section className="panel">
          <h2>Record a payment received</h2>
          <SaveForm
            operation="payment"
            initial={{
              amount: "",
              paid_on: "",
              method: "Bank transfer",
              reference: "",
            }}
            spec={[
              { key: "amount", label: "Amount received (INR)", required: true },
              {
                key: "paid_on",
                label: "Date received",
                type: "date",
                required: true,
              },
              { key: "method", label: "Method", required: true },
              {
                key: "reference",
                label: "Bank / receipt reference",
                required: true,
              },
            ]}
            extra={{ booking_id: id }}
          />
          {payments.map((p) => (
            <p key={p.id}>
              {String(p.paid_on)} · {inr(String(p.amount))} ·{" "}
              {String(p.reference)}
            </p>
          ))}
        </section>
      </>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Private {module}</p>
          <h1>{String(title)}</h1>
          {row?.reference && <p>{row.reference}</p>}
        </div>
        <Link href={"/admin/" + module}>← Back to {module}</Link>
      </div>
      {content}
    </>
  );
}
