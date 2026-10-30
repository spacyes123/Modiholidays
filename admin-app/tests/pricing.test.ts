import { describe, it, expect } from "vitest";
import { calculateQuote } from "../lib/pricing";
import { quote, enquiry } from "./fixtures";
import { enquirySchema, itinerarySchema, quoteSchema } from "../lib/schemas";
const travellers = { adults: 2, children: 1, infants: 0 };
describe("Decimal-safe quote calculations", () => {
  it("distinguishes 20% margin from 20% markup", () => {
    const margin = calculateQuote(quote, travellers);
    const markup = calculateQuote(
      { ...quote, pricing_mode: "markup" },
      travellers,
    );
    expect(margin.sellingBeforeTax).toBe("37500.00");
    expect(markup.sellingBeforeTax).toBe("36000.00");
    expect(margin.profit).toBe("7500.00");
    expect(margin.marginPercent).toBe("20.0000");
  });
  it("rounds each line to paise, not binary floating point", () => {
    const c = {
      ...quote,
      costs: [
        { ...quote.costs[0], unit_cost: "0.10", quantity: "3", nights: 1 },
      ],
      target_percent: "0",
      tax_percent: "0",
    };
    expect(calculateQuote(c, travellers, "0").finalPrice).toBe("0.30");
  });
  it("supports explicit FX and correct room-night multipliers", () => {
    expect(
      calculateQuote(
        {
          ...quote,
          costs: [
            {
              ...quote.costs[0],
              quantity: "2",
              nights: 3,
              unit_cost: "100",
              currency: "USD",
              fx_rate: "83.12345678",
            },
          ],
        },
        travellers,
      ).supplierCost,
    ).toBe("49874.07");
  });
  it("supports configurable TCS bases without a universal rate", () => {
    const a = calculateQuote(
      { ...quote, tcs_percent: "2", tcs_base: "pre-tax" },
      travellers,
    );
    const b = calculateQuote(
      { ...quote, tcs_percent: "2", tcs_base: "with-tax" },
      travellers,
    );
    expect(a.tcs).toBe("750.00");
    expect(b.tcs).toBe("787.50");
  });
  it("does not invent equal adult/child allocation", () => {
    expect(calculateQuote(quote, travellers).allocation).toBeNull();
    expect(() =>
      calculateQuote(
        { ...quote, adult_price: "15000", child_price: "5000" },
        travellers,
      ),
    ).toThrow(/allocation/);
    const q = calculateQuote(
      { ...quote, adult_price: "17000", child_price: "5375" },
      travellers,
    );
    expect(q.allocation?.child).toBe("5375");
  });
  it("rejects zero travellers, negative cost, zero rooms, and invalid margin", () => {
    expect(() => calculateQuote(quote, { ...travellers, adults: 0 })).toThrow();
    expect(
      quoteSchema.safeParse({
        ...quote,
        costs: [{ ...quote.costs[0], unit_cost: "-1" }],
      }).success,
    ).toBe(false);
    expect(
      quoteSchema.safeParse({
        ...quote,
        costs: [{ ...quote.costs[0], quantity: "0" }],
      }).success,
    ).toBe(false);
    expect(() =>
      calculateQuote({ ...quote, target_percent: "100" }, travellers),
    ).toThrow();
  });
  it("requires override reasons and records minimum-margin warnings", () => {
    expect(() =>
      calculateQuote({ ...quote, manual_price: "1" }, travellers),
    ).toThrow();
    expect(
      calculateQuote(
        { ...quote, manual_price: "1", override_reason: "Test only" },
        travellers,
      ).warnings.join(" "),
    ).toMatch(/minimum/);
  });
  it("warns about missing hotel costs and expired rates", () => {
    expect(
      calculateQuote({ ...quote, costs: [] }, travellers).warnings.join(" "),
    ).toMatch(/hotel/);
    expect(
      calculateQuote(
        {
          ...quote,
          costs: [{ ...quote.costs[0], rate_valid_until: "2000-01-01" }],
        },
        travellers,
      ).warnings.join(" "),
    ).toMatch(/expired/);
  });
  it("validates contact details, room count, children ages and dates", () => {
    expect(enquirySchema.safeParse({ ...enquiry, mobile: "" }).success).toBe(
      false,
    );
    expect(enquirySchema.safeParse({ ...enquiry, rooms: 0 }).success).toBe(
      false,
    );
    expect(
      enquirySchema.safeParse({ ...enquiry, children_ages: [] }).success,
    ).toBe(false);
    expect(
      enquirySchema.safeParse({ ...enquiry, end_date: "2026-01-01" }).success,
    ).toBe(false);
    expect(itinerarySchema.safeParse({}).success).toBe(false);
  });
});
