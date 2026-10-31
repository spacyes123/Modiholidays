import "server-only";
import { employee } from "./supabase";
import fs from "node:fs";
import path from "node:path";
export const modules = [
  "enquiries",
  "itineraries",
  "quotations",
  "bookings",
  "suppliers",
  "settings",
] as const;
export type Module = (typeof modules)[number];
export type Row = {
  id: string;
  title?: string;
  name?: string;
  reference?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  details: Record<string, unknown>;
  [key: string]: unknown;
};
export function catalogueTemplates() {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public/assets/packages.json"),
      "utf8",
    ),
  ) as {
    id: string;
    name: string;
    destination: string;
    route: string[];
    days: string[];
    image: string;
    category: string;
  }[];
  return data.map((p) => ({
    id: p.id,
    title: p.name,
    destination: p.destination,
    image: p.image,
    days: p.days.map((d, i) => ({
      city: "",
      date: "",
      title: `Day ${i + 1}`,
      description: d,
      hotel: "",
      meals: "",
      sightseeing: "",
      transport: "",
      pickup_drop: "",
      optional_activities: "",
      image: p.image,
      internal_notes: "",
    })),
  }));
}
function selection(table: string) {
  return table === "bookings"
    ? "*,exact_value:value::text"
    : table === "payments"
      ? "*,exact_amount:amount::text"
      : table === "supplier_rates"
        ? "*,exact_amount:amount::text"
        : table === "quotation_cost_items"
          ? "*,exact_unit_cost:unit_cost::text,exact_quantity:quantity::text,exact_fx_rate:fx_rate::text"
          : "*";
}
function exact(row: Row) {
  if (row.exact_value !== undefined) row.value = row.exact_value;
  if (row.exact_amount !== undefined) row.amount = row.exact_amount;
  if (row.exact_unit_cost !== undefined) row.unit_cost = row.exact_unit_cost;
  if (row.exact_quantity !== undefined) row.quantity = row.exact_quantity;
  if (row.exact_fx_rate !== undefined) row.fx_rate = row.exact_fx_rate;
  return row;
}
export async function records(
  table: string,
  filter?: { column: string; value: string },
) {
  if (
    ![
      ...modules,
      "quotation_overview",
      "customers",
      "enquiry_activities",
      "itinerary_days",
      "itinerary_revisions",
      "itinerary_templates",
      "quotation_versions",
      "quotation_cost_items",
      "supplier_rates",
      "payments",
      "admin_profiles",
      "operations_settings",
      "pdf_exports",
      "audit_logs",
    ].includes(table)
  )
    throw Error("Unknown record type");
  const { db } = await employee();
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = db
      .from(table)
      .select(selection(table))
      .order(table === "itinerary_days" ? "position" : "created_at", {
        ascending: table === "itinerary_days",
      })
      .range(offset, offset + 999);
    if (filter) query = query.eq(filter.column, filter.value);
    const { data, error } = await query;
    if (error) throw Error(error.message);
    const batch = (data || []) as unknown as Row[];
    rows.push(...batch.map(exact));
    if (batch.length < 1000) break;
  }
  return rows;
}
export async function record(table: string, id: string) {
  const { db } = await employee();
  if (
    ![
      "enquiries",
      "itineraries",
      "quotations",
      "bookings",
      "suppliers",
    ].includes(table)
  )
    throw Error("Invalid module");
  const { data, error } = await db
    .from(table)
    .select(selection(table))
    .eq("id", id)
    .single();
  if (error) throw Error("Record unavailable or access denied.");
  return exact(data as unknown as Row);
}
