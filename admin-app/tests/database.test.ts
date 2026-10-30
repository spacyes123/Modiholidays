import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import {
  adminId,
  staffId,
  strangerId,
  enquiry,
  itinerary,
  quote,
} from "./fixtures";
import { customerQuote } from "../lib/customer-quote";
const db = new PGlite();
let enquiryId: string,
  itineraryId: string,
  quotationId: string,
  versionId: string,
  bookingId: string;
async function asUser(id: string | null, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
  await db.exec("set role " + role);
}
async function rpc<T = string>(name: string, args: unknown[]) {
  const result = await db.query<{ value: T }>(
    `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as value`,
    args,
  );
  return result.rows[0].value;
}
beforeAll(async () => {
  await db.exec(
    "create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;",
  );
  await db.exec(
    fs.readFileSync("supabase/migrations/001_operations.sql", "utf8"),
  );
  await db.exec(
    fs.readFileSync("supabase/migrations/003_dashboard.sql", "utf8"),
  );
  await db.query("insert into auth.users(id) values($1),($2),($3)", [
    adminId,
    staffId,
    strangerId,
  ]);
  await db.query(
    "insert into admin_profiles(id,display_name,role) values($1,'QA Admin','admin'),($2,'QA Staff','staff')",
    [adminId, staffId],
  );
  await asUser(adminId);
}, 120000);
afterAll(async () => {
  await db.close();
});
describe("Persisted Postgres workflow and row-level security", () => {
  it("serves actual empty dashboard aggregates only to employees", async () => {
    const empty = await rpc<{
      metrics: { total_enquiries: number; confirmed_value: string };
    }>("dashboard_overview", []);
    expect(empty.metrics.total_enquiries).toBe(0);
    expect(empty.metrics.confirmed_value).toBe("0");
    await asUser(null, "anon");
    await expect(rpc("dashboard_overview", [])).rejects.toThrow();
    await asUser(adminId);
  });
  it("blocks anonymous and unprovisioned accounts", async () => {
    await asUser(null, "anon");
    await expect(db.query("select * from enquiries")).rejects.toThrow();
    await expect(
      rpc("create_quotation", [crypto.randomUUID(), "No"]),
    ).rejects.toThrow();
    await asUser(strangerId);
    expect((await db.query("select * from enquiries")).rows).toHaveLength(0);
    await expect(rpc("save_enquiry", [null, enquiry])).rejects.toThrow();
    await asUser(adminId);
  });
  it("creates and edits a persisted customer enquiry and activity", async () => {
    enquiryId = await rpc("save_enquiry", [null, enquiry]);
    await rpc("save_enquiry", [enquiryId, { ...enquiry, status: "Planning" }]);
    await db.query(
      "insert into enquiry_activities(enquiry_id,kind,body) values($1,'Follow-up','QA follow-up')",
      [enquiryId],
    );
    expect(
      (
        await db.query<{ status: string }>(
          "select status from enquiries where id=$1",
          [enquiryId],
        )
      ).rows[0].status,
    ).toBe("Planning");
  });
  it("saves and reopens editable days, records revisions, rejects stale saves", async () => {
    itineraryId = await rpc("save_itinerary", [null, itinerary(enquiryId)]);
    await rpc("save_itinerary", [
      itineraryId,
      {
        ...itinerary(enquiryId),
        revision: 0,
        days: [{ ...itinerary(enquiryId).days[0], title: "Changed day" }],
      },
    ]);
    expect(
      (
        await db.query(
          "select * from itinerary_revisions where itinerary_id=$1",
          [itineraryId],
        )
      ).rows,
    ).toHaveLength(1);
    await expect(
      rpc("save_itinerary", [itineraryId, itinerary(enquiryId)]),
    ).rejects.toThrow(/Reload|reload/);
  });
  it("creates multiple quotation versions attached to one itinerary", async () => {
    quotationId = await rpc("create_quotation", [itineraryId, "QA quotation"]);
    versionId = await rpc("save_quote_version", [quotationId, null, 0, quote]);
    const alternate = await rpc("save_quote_version", [
      quotationId,
      null,
      0,
      { ...quote, variant: "Luxury" },
    ]);
    expect(alternate).not.toBe(versionId);
    expect(
      (
        await db.query(
          "select * from quotation_versions where quotation_id=$1",
          [quotationId],
        )
      ).rows,
    ).toHaveLength(2);
  });
  it("rejects staff approval and direct workflow-table writes", async () => {
    await asUser(staffId);
    await expect(rpc("approve_quote", [versionId, 0])).rejects.toThrow(
      /admin/i,
    );
    await expect(
      db.query("update quotation_versions set status='Approved' where id=$1", [
        versionId,
      ]),
    ).rejects.toThrow();
    await asUser(adminId);
  });
  it("freezes approved versions and strips confidential fields from snapshots", async () => {
    await rpc("approve_quote", [versionId, 0]);
    const v = (
      await db.query<{
        snapshot: unknown;
        totals: { finalPrice: number; profit: number };
      }>("select snapshot,totals from quotation_versions where id=$1", [
        versionId,
      ])
    ).rows[0];
    expect(String(v.totals.finalPrice)).toBe("39375.00");
    expect(String(v.totals.profit)).toBe("7500.00");
    expect(JSON.stringify(v.snapshot)).not.toContain("CONFIDENTIAL");
    const safe = customerQuote({
      ...(v.snapshot as object),
      profit: "MUST_NOT_EXPORT",
      supplier_cost: "MUST_NOT_EXPORT",
    });
    expect(JSON.stringify(safe)).not.toContain("MUST_NOT_EXPORT");
    await expect(
      rpc("save_quote_version", [quotationId, versionId, 1, quote]),
    ).rejects.toThrow(/immutable/);
  });
  it("requires approval before sending and booking conversion", async () => {
    const draft = (
      await db.query<{ id: string }>(
        "select id from quotation_versions where status='Draft' limit 1",
      )
    ).rows[0].id;
    await expect(rpc("mark_quote", [draft, "Sent"])).rejects.toThrow();
    await expect(
      rpc("convert_booking", [draft, "2027-01-15"]),
    ).rejects.toThrow();
    await rpc("mark_quote", [versionId, "Ready to send"]);
    await rpc("mark_quote", [versionId, "Sent"]);
  });
  it("records payments without confirming a booking and prevents overpayment", async () => {
    bookingId = await rpc("convert_booking", [versionId, "2027-01-15"]);
    await rpc("record_payment", [
      bookingId,
      "1000",
      "2027-01-01",
      "Bank transfer",
      "QA ref",
    ]);
    const state = (
      await db.query<{ status: string }>(
        "select status from bookings where id=$1",
        [bookingId],
      )
    ).rows[0].status;
    expect(state).toBe("Advance Received");
    await expect(
      rpc("record_payment", [bookingId, "999999", "2027-01-01", "Bank", "QA"]),
    ).rejects.toThrow(/balance/);
    await expect(
      rpc("convert_booking", [versionId, "2027-01-15"]),
    ).rejects.toThrow();
  });
  it("requires supplier confirmation before confirming and completing", async () => {
    await rpc("set_booking_state", [
      bookingId,
      "Supplier Confirmation",
      "Pending",
    ]);
    await expect(
      rpc("set_booking_state", [bookingId, "Confirmed", "Pending"]),
    ).rejects.toThrow(/Supplier confirmation/);
    await rpc("set_booking_state", [bookingId, "Confirmed", "Confirmed"]);
    await rpc("set_booking_state", [bookingId, "Completed", "Confirmed"]);
  });
  it("audits quotation and booking changes and keeps audit logs admin-only", async () => {
    expect(
      (await db.query("select * from audit_logs")).rows.length,
    ).toBeGreaterThan(8);
    await asUser(staffId);
    expect((await db.query("select * from audit_logs")).rows).toHaveLength(0);
    await asUser(adminId);
  });
  it("rejects zero travellers, negative costs, expired rates and missing hotel costs", async () => {
    await expect(
      rpc("save_enquiry", [null, { ...enquiry, adults: 0 }]),
    ).rejects.toThrow();
    await expect(
      rpc("save_quote_version", [
        quotationId,
        null,
        0,
        { ...quote, costs: [{ ...quote.costs[0], unit_cost: "-1" }] },
      ]),
    ).rejects.toThrow();
    const expired = await rpc("save_quote_version", [
      quotationId,
      null,
      0,
      {
        ...quote,
        costs: [{ ...quote.costs[0], rate_valid_until: "2000-01-01" }],
      },
    ]);
    await expect(rpc("approve_quote", [expired, 0])).rejects.toThrow(/expired/);
    const noHotel = await rpc("save_quote_version", [
      quotationId,
      null,
      0,
      { ...quote, costs: [{ ...quote.costs[0], category: "Transport" }] },
    ]);
    await expect(rpc("approve_quote", [noHotel, 0])).rejects.toThrow(/Hotel/);
  });
  it("protects intake secret, persists normalized contacts, deduplicates and throttles", async () => {
    await db.exec("reset role");
    await db.query(
      "update private.ingress_settings set secret_hash=encode(sha256(convert_to($1,'UTF8')),'hex')",
      ["qa-only-ingress-secret"],
    );
    await asUser(null, "anon");
    const key = crypto.randomUUID();
    const payload = {
      name: "QA website customer",
      phone: "9999999999",
      email: "qa@example.com",
      destination: "Kerala",
      departureCity: "Mumbai",
      adults: 2,
      children: 0,
    };
    await expect(
      rpc("receive_public_enquiry", [null, key, "qa-source", payload]),
    ).rejects.toThrow(/disabled/);
    await expect(
      rpc("receive_public_enquiry", ["incorrect", key, "qa-source", payload]),
    ).rejects.toThrow(/disabled/);
    const saved = await rpc("receive_public_enquiry", [
      "qa-only-ingress-secret",
      key,
      "qa-source",
      payload,
    ]);
    expect(
      await rpc("receive_public_enquiry", [
        "qa-only-ingress-secret",
        key,
        "qa-source",
        payload,
      ]),
    ).toBe(saved);
    for (let i = 1; i < 8; i++)
      await rpc("receive_public_enquiry", [
        "qa-only-ingress-secret",
        crypto.randomUUID(),
        "qa-source",
        payload,
      ]);
    await expect(
      rpc("receive_public_enquiry", [
        "qa-only-ingress-secret",
        crypto.randomUUID(),
        "qa-source",
        payload,
      ]),
    ).rejects.toThrow(/Too many/);
    await expect(
      db.query("select * from private.ingress_settings"),
    ).rejects.toThrow();
    await asUser(adminId);
    const row = (
      await db.query<{ details: { mobile: string; destinations: string } }>(
        "select details from enquiries where id=$1",
        [saved],
      )
    ).rows[0];
    expect(row.details.mobile).toBe(payload.phone);
    expect(row.details.destinations).toBe("Kerala");
  });
});
