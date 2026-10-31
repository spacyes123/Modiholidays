import { z } from "zod";
const text = z.string().trim().max(12000),
  short = z.string().trim().max(240),
  date = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(v + "T00:00:00Z");
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
    }, "Invalid date")
    .or(z.literal(""));
export const money = z
  .string()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Use a non-negative amount with at most two decimals",
  );
export const enquirySchema = z
  .object({
    name: short.min(1),
    mobile: z.string().regex(/^\+?[\d ()-]{7,20}$/),
    whatsapp: short.default(""),
    email: z.email().or(z.literal("")),
    departure_city: short.min(1),
    destinations: short.min(1),
    start_date: date,
    end_date: date,
    adults: z.coerce.number().int().min(1).max(500),
    children: z.coerce.number().int().min(0).max(500),
    infants: z.coerce.number().int().min(0).max(100),
    children_ages: z.array(z.number().int().min(0).max(17)),
    rooms: z.coerce.number().int().min(1).max(250),
    hotel_category: short,
    meal_plan: short,
    transport: text,
    budget: money.or(z.literal("")),
    special_requirements: text,
    source: short,
    assigned_to: z.uuid().or(z.literal("")),
    follow_up: date,
    status: z.enum([
      "New",
      "Contacted",
      "Planning",
      "Quoted",
      "Follow-up",
      "Confirmed",
      "Lost",
    ]),
    lost_reason: text,
    internal_notes: text,
  })
  .superRefine((v, c) => {
    if (v.children_ages.length !== v.children)
      c.addIssue({
        code: "custom",
        path: ["children_ages"],
        message: "Enter one age per child",
      });
    if (v.start_date && v.end_date && v.end_date < v.start_date)
      c.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "End date must follow start date",
      });
    if (v.status === "Lost" && !v.lost_reason)
      c.addIssue({
        code: "custom",
        path: ["lost_reason"],
        message: "Record why the enquiry was lost",
      });
  });
export const daySchema = z.object({
  city: short,
  title: short.min(1),
  date: date,
  description: text.min(1),
  hotel: short,
  meals: short,
  sightseeing: text,
  transport: text,
  pickup_drop: text,
  optional_activities: text,
  image: short.refine(
    (v) => !v || /^assets\/photos\/[a-z0-9-]+\.webp$/.test(v),
    "Use an existing local destination photograph",
  ),
  internal_notes: text,
});
export const itinerarySchema = z
  .object({
    title: short.min(1),
    enquiry_id: z.uuid(),
    revision: z.number().int().nonnegative(),
    start_date: date,
    end_date: date,
    destinations: short.min(1),
    adults: z.coerce.number().int().min(1),
    children: z.coerce.number().int().nonnegative(),
    infants: z.coerce.number().int().nonnegative(),
    hotel_category: short,
    tour_type: short,
    departure_city: short,
    internal_notes: text,
    days: z.array(daySchema).min(1).max(90),
  })
  .superRefine((v, c) => {
    if (v.start_date && v.end_date && v.end_date < v.start_date)
      c.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "Invalid travel dates",
      });
  });
export const categories = [
  "Hotels",
  "Transport",
  "Flights",
  "Trains",
  "Sightseeing",
  "Activities",
  "Meals",
  "Tour guide",
  "Entry tickets",
  "Permits",
  "Miscellaneous",
  "Contingency",
] as const;
export const costSchema = z.object({
  supplier_id: z.uuid().or(z.literal("")),
  category: z.enum(categories),
  description: short.min(1),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,3})?$/)
    .refine((v) => Number(v) > 0),
  nights: z.coerce.number().int().min(1).max(365),
  unit: z.enum([
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
  unit_cost: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  fx_rate: z
    .string()
    .regex(/^\d+(\.\d{1,8})?$/)
    .refine((v) => Number(v) > 0),
  rate_valid_until: date,
  tax_treatment: short,
  confirmation: z.enum(["Estimated", "Requested", "Confirmed"]),
  notes: text,
});
export const quoteSchema = z
  .object({
    title: short.min(1),
    variant: z.enum(["Budget", "Premium", "Luxury", "Custom"]),
    pricing_mode: z.enum(["margin", "markup"]),
    target_percent: z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/)
      .refine((v) => Number(v) <= 1000),
    contingency: money,
    tax_percent: z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/)
      .refine((v) => Number(v) <= 100),
    tcs_percent: z
      .string()
      .regex(/^\d+(\.\d{1,4})?$/)
      .refine((v) => Number(v) <= 100),
    tcs_base: z.enum(["pre-tax", "with-tax"]),
    tax_notes: short.min(1),
    manual_price: money.or(z.literal("")),
    override_reason: text,
    valid_until: date.refine((v) => !!v, "Validity date required"),
    inclusions: text,
    exclusions: text,
    hotel_details: text,
    transport_details: text,
    payment_schedule: text,
    cancellation_policy: text,
    travel_notes: text,
    internal_notes: text,
    adult_price: money.or(z.literal("")),
    child_price: money.or(z.literal("")),
    infant_price: money.or(z.literal("")),
    hotel_cost_explanation: text,
    costs: z.array(costSchema).max(300),
  })
  .superRefine((v, c) => {
    if (v.pricing_mode === "margin" && Number(v.target_percent) >= 100)
      c.addIssue({
        code: "custom",
        path: ["target_percent"],
        message: "Gross margin must be below 100%",
      });
    if (v.manual_price && !v.override_reason.trim())
      c.addIssue({
        code: "custom",
        path: ["override_reason"],
        message: "Manual override requires a reason",
      });
    if (
      v.costs.some((i) => i.currency !== "INR" && i.fx_rate === "1" && !i.notes)
    )
      c.addIssue({
        code: "custom",
        path: ["costs"],
        message: "Record the source/reason for foreign-exchange rates",
      });
  });
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type ItineraryInput = z.infer<typeof itinerarySchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type CostInput = z.infer<typeof costSchema>;
export const supplierSchema = z.object({
  name: short.min(1),
  category: z.enum([
    "Hotels",
    "Transport operators",
    "DMCs",
    "Tour guides",
    "Activity providers",
    "Other vendors",
  ]),
  destination: short.min(1),
  contact_name: short,
  email: z.email().or(z.literal("")),
  phone: short,
  internal_notes: text,
  rate_valid_until: date,
  rate_source: short,
  last_verified: date,
});
