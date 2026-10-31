import Decimal from "decimal.js";
import { quoteSchema, type QuoteInput } from "./schemas";
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
const d = (v: string | number) => new Decimal(v || 0);
const cents = (v: Decimal) => v.toDecimalPlaces(2).toFixed(2);
export function calculateQuote(
  input: QuoteInput,
  travellers: { adults: number; children: number; infants: number },
  minimumMargin = "10",
  today = new Date().toISOString().slice(0, 10),
) {
  const q = quoteSchema.parse(input);
  if (
    !Number.isInteger(travellers.adults) ||
    travellers.adults < 1 ||
    travellers.children < 0 ||
    travellers.infants < 0
  )
    throw Error("At least one adult and valid traveller counts are required");
  const lineTotals = q.costs.map((c) =>
    d(c.quantity)
      .times(c.nights)
      .times(c.unit_cost)
      .times(c.fx_rate)
      .toDecimalPlaces(2),
  );
  const supplier = lineTotals.reduce((sum, v) => sum.plus(v), d(0));
  const total = supplier.plus(q.contingency);
  const fraction = d(q.target_percent).div(100);
  let before =
    q.pricing_mode === "margin"
      ? total.div(d(1).minus(fraction))
      : total.times(d(1).plus(fraction));
  if (q.manual_price) before = d(q.manual_price);
  before = before.toDecimalPlaces(2);
  const tax = before.times(q.tax_percent).div(100).toDecimalPlaces(2);
  const tcs = (q.tcs_base === "with-tax" ? before.plus(tax) : before)
    .times(q.tcs_percent)
    .div(100)
    .toDecimalPlaces(2);
  const final = before.plus(tax).plus(tcs);
  const profit = before.minus(total);
  const margin = before.isZero() ? d(0) : profit.div(before).times(100);
  const warnings: string[] = [];
  if (margin.lt(minimumMargin))
    warnings.push("Below the configured minimum gross margin.");
  if (!q.costs.length) warnings.push("No supplier costs entered.");
  if (
    !q.costs.some((c) => c.category === "Hotels") &&
    !q.hotel_cost_explanation.trim()
  )
    warnings.push(
      "Enter hotel costs or explain why accommodation is excluded.",
    );
  if (q.costs.some((c) => c.rate_valid_until && c.rate_valid_until < today))
    warnings.push("One or more supplier rates have expired.");
  if (q.costs.some((c) => c.confirmation !== "Confirmed"))
    warnings.push("Some supplier costs remain estimates.");
  if (q.valid_until < today) warnings.push("Quotation validity has expired.");
  const allocated = q.adult_price || q.child_price || q.infant_price;
  if (allocated) {
    const sum = d(q.adult_price)
      .times(travellers.adults)
      .plus(d(q.child_price).times(travellers.children))
      .plus(d(q.infant_price).times(travellers.infants));
    if (!sum.eq(final))
      throw Error(
        "Adult, child and infant price allocations must add up to the final selling price.",
      );
  }
  return {
    supplierCost: cents(supplier),
    contingency: cents(d(q.contingency)),
    estimatedCost: cents(total),
    sellingBeforeTax: cents(before),
    tax: cents(tax),
    tcs: cents(tcs),
    finalPrice: cents(final),
    profit: cents(profit),
    marginPercent: margin.toFixed(4),
    lineTotals: lineTotals.map(cents),
    warnings,
    allocation: allocated
      ? { adult: q.adult_price, child: q.child_price, infant: q.infant_price }
      : null,
  };
}
export function inr(value: string | number) {
  const amount = new Decimal(value || 0);
  const [whole, fraction] = amount.abs().toFixed(2).split(".");
  const rest =
    whole.length > 3
      ? whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ","
      : "";
  return `${amount.isNegative() ? "-" : ""}₹${rest}${whole.slice(-3)}.${fraction}`;
}
