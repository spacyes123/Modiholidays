"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fields, type FieldSpec } from "./forms";
import { mutate } from "@/lib/actions";
import { calculateQuote, inr } from "@/lib/pricing";
import { categories, type QuoteInput, type CostInput } from "@/lib/schemas";
export const blankQuote: QuoteInput = {
  title: "Custom holiday quotation",
  variant: "Custom",
  pricing_mode: "margin",
  target_percent: "20",
  contingency: "0",
  tax_percent: "0",
  tcs_percent: "0",
  tcs_base: "pre-tax",
  tax_notes: "",
  manual_price: "",
  override_reason: "",
  valid_until: "",
  inclusions: "",
  exclusions: "",
  hotel_details: "",
  transport_details: "",
  payment_schedule: "",
  cancellation_policy: "",
  travel_notes: "",
  internal_notes: "",
  adult_price: "",
  child_price: "",
  infant_price: "",
  hotel_cost_explanation: "",
  costs: [],
};
const blankCost: CostInput = {
  supplier_id: "",
  category: "Hotels",
  description: "",
  quantity: "1",
  nights: 1,
  unit: "per-booking",
  unit_cost: "0",
  currency: "INR",
  fx_rate: "1",
  rate_valid_until: "",
  tax_treatment: "",
  confirmation: "Estimated",
  notes: "",
};
const select = (items: string[]) =>
  items.map((value) => ({ value, label: value }));
const fields: FieldSpec[] = [
  { key: "title", label: "Customer quotation title", required: true },
  {
    key: "variant",
    label: "Option",
    options: select(["Budget", "Premium", "Luxury", "Custom"]),
  },
  {
    key: "pricing_mode",
    label: "Pricing formula",
    options: [
      { value: "margin", label: "Gross margin: cost ÷ (1 − margin)" },
      { value: "markup", label: "Markup: cost × (1 + markup)" },
    ],
  },
  { key: "target_percent", label: "Target %" },
  { key: "contingency", label: "Additional contingency (INR)" },
  { key: "tax_percent", label: "Applicable GST / tax % — confirm transaction" },
  { key: "tcs_percent", label: "Applicable TCS % — confirm transaction" },
  {
    key: "tcs_base",
    label: "TCS calculation base",
    options: [
      { value: "pre-tax", label: "Selling price before tax" },
      { value: "with-tax", label: "Selling price including GST / tax" },
    ],
  },
  {
    key: "tax_notes",
    label: "Transaction type and tax treatment explanation",
    required: true,
  },
  { key: "manual_price", label: "Manual pre-tax selling price override (INR)" },
  {
    key: "override_reason",
    label: "Mandatory reason when overriding",
    type: "textarea",
  },
  {
    key: "valid_until",
    label: "Quotation valid until",
    type: "date",
    required: true,
  },
  { key: "adult_price", label: "Final price allocation per adult (optional)" },
  { key: "child_price", label: "Final price allocation per child (optional)" },
  {
    key: "infant_price",
    label: "Final price allocation per infant (optional)",
  },
  {
    key: "hotel_cost_explanation",
    label: "Reason if hotel costs are excluded",
    type: "textarea",
  },
  { key: "hotel_details", label: "Customer hotel details", type: "textarea" },
  {
    key: "transport_details",
    label: "Customer transport details",
    type: "textarea",
  },
  { key: "inclusions", label: "Customer inclusions", type: "textarea" },
  { key: "exclusions", label: "Customer exclusions", type: "textarea" },
  {
    key: "payment_schedule",
    label: "Customer payment schedule",
    type: "textarea",
  },
  {
    key: "cancellation_policy",
    label: "Customer cancellation policy",
    type: "textarea",
  },
  { key: "travel_notes", label: "Customer travel notes", type: "textarea" },
  {
    key: "internal_notes",
    label: "Internal notes — never exported",
    type: "textarea",
  },
];
export default function QuoteEditor({
  quotationId,
  versionId,
  revision,
  initial,
  travellers,
  suppliers,
  rates,
  minimumMargin,
}: {
  quotationId: string;
  versionId?: string;
  revision: number;
  initial: QuoteInput;
  travellers: { adults: number; children: number; infants: number };
  suppliers: { id: string; name: string }[];
  rates: Record<string, unknown>[];
  minimumMargin: string;
}) {
  const [data, setData] = useState(initial),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  let result: ReturnType<typeof calculateQuote> | null = null;
  let calculationError = "";
  try {
    result = calculateQuote(data, travellers, minimumMargin);
  } catch (e) {
    calculationError =
      e instanceof Error ? e.message : "Complete the pricing fields.";
  }
  const costFields: FieldSpec[] = [
    {
      key: "supplier_id",
      label: "Supplier",
      options: [
        { value: "", label: "Not assigned" },
        ...suppliers.map((s) => ({ value: s.id, label: s.name })),
      ],
    },
    {
      key: "category",
      label: "Cost category",
      options: select([...categories]),
    },
    { key: "description", label: "Description", required: true },
    { key: "quantity", label: "Quantity (rooms / vehicles / travellers)" },
    {
      key: "nights",
      label: "Night multiplier (1 if already included)",
      type: "number",
    },
    {
      key: "unit",
      label: "Costing unit",
      options: select([
        "per-room-night",
        "per-room",
        "per-night",
        "per-vehicle",
        "per-adult",
        "per-child",
        "per-infant",
        "per-person",
        "per-booking",
      ]),
    },
    { key: "unit_cost", label: "Unit supplier cost" },
    { key: "currency", label: "Currency" },
    { key: "fx_rate", label: "INR per currency unit (manual verified rate)" },
    { key: "rate_valid_until", label: "Rate valid until", type: "date" },
    { key: "tax_treatment", label: "Supplier tax treatment" },
    {
      key: "confirmation",
      label: "Supplier confirmation",
      options: select(["Estimated", "Requested", "Confirmed"]),
    },
    {
      key: "notes",
      label: "Internal cost / FX source notes",
      type: "textarea",
    },
  ];
  return (
    <>
      <div className="notice">
        Internal costing only. Customer exports contain only the approved
        customer snapshot. Tax settings must be verified for this transaction;
        0% is a draft default, not tax advice.
      </div>
      <div className="panel">
        <Fields
          spec={fields}
          data={data}
          onChange={(key, value) => setData({ ...data, [key]: value })}
        />
      </div>
      <div className="editor-toolbar">
        <h2>Supplier costing</h2>
        <button
          onClick={() =>
            setData({ ...data, costs: [...data.costs, { ...blankCost }] })
          }
        >
          + Cost line
        </button>
      </div>
      <label>
        Add an editable stored supplier rate
        <select
          value=""
          onChange={(e) => {
            const r = rates.find((r) => r.id === e.target.value);
            if (r)
              setData({
                ...data,
                costs: [
                  ...data.costs,
                  {
                    ...blankCost,
                    supplier_id: String(r.supplier_id),
                    description: String(r.description),
                    unit_cost: String(r.amount),
                    currency: String(r.currency),
                    rate_valid_until: String(r.valid_until),
                    notes: "Rate source: " + String(r.source),
                  },
                ],
              });
          }}
        >
          <option value="">
            Select a recorded rate (not live availability)
          </option>
          {rates.map((r) => (
            <option key={String(r.id)} value={String(r.id)}>
              {String(r.description)} · {String(r.currency)} {String(r.amount)}{" "}
              · until {String(r.valid_until)}
            </option>
          ))}
        </select>
      </label>
      {data.costs.map((cost, index) => (
        <section className="panel" key={index}>
          <div className="editor-toolbar">
            <h3>Cost {index + 1}</h3>
            <button
              className="danger"
              onClick={() => {
                if (window.confirm("Remove this cost line?"))
                  setData({
                    ...data,
                    costs: data.costs.filter((_, n) => n !== index),
                  });
              }}
            >
              Remove line
            </button>
          </div>
          <Fields
            spec={costFields}
            data={cost}
            onChange={(key, value) =>
              setData({
                ...data,
                costs: data.costs.map((c, n) =>
                  n === index
                    ? { ...c, [key]: key === "nights" ? Number(value) : value }
                    : c,
                ),
              })
            }
          />
        </section>
      ))}
      <section className="panel price-summary">
        <h2>Pricing preview</h2>
        {result ? (
          <>
            <dl>
              {Object.entries({
                supplierCost: "Supplier cost",
                contingency: "Contingency",
                estimatedCost: "Estimated tour cost",
                sellingBeforeTax: "Selling before tax",
                tax: "Applicable tax",
                tcs: "TCS",
                finalPrice: "Final selling price",
                profit: "Expected gross profit",
              }).map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{inr(result![key as keyof typeof result] as string)}</dd>
                </div>
              ))}
              <div>
                <dt>Gross margin</dt>
                <dd>{result.marginPercent}%</dd>
              </div>
            </dl>
            {result.warnings.map((w) => (
              <p className="notice" key={w}>
                {w}
              </p>
            ))}
            <p>
              {result.allocation
                ? "Passenger allocations entered; their sum is validated."
                : "No per-person split is inferred. Enter adult / child / infant allocations if required; their total must match the final price."}
            </p>
          </>
        ) : (
          <p role="status">{calculationError}</p>
        )}
      </section>
      <div className="sticky-save">
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await mutate("version", {
              quotation_id: quotationId,
              id: versionId || null,
              revision,
              data,
            });
            setBusy(false);
            setStatus(r.error || "Draft saved.");
            if (!r.error) {
              router.push(
                "/admin/quotations/" + quotationId + "?version=" + r.id,
              );
              router.refresh();
            }
          }}
        >
          Save quotation draft
        </button>
        {versionId && (
          <button
            disabled={busy}
            className="secondary"
            onClick={async () => {
              const r = await mutate("version", {
                quotation_id: quotationId,
                id: null,
                revision: 0,
                data,
              });
              setStatus(r.error || "New version created");
              if (r.id) {
                router.push(
                  "/admin/quotations/" + quotationId + "?version=" + r.id,
                );
                router.refresh();
              }
            }}
          >
            Save as new version
          </button>
        )}
        <p role="status">{status}</p>
      </div>
    </>
  );
}
