import { z } from "zod";
const value = z.union([z.string(), z.number()]).transform(String);
const s = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v || "");
const day = z.object({
  position: z.number().int(),
  city: s,
  title: s,
  date: s,
  description: s,
  hotel: s,
  meals: s,
  sightseeing: s,
  transport: s,
  pickup_drop: s,
  optional_activities: s,
  image: s,
});
const snapshot = z.object({
  reference: z.string(),
  title: z.string(),
  customer: z.object({ name: z.string(), mobile: z.string(), email: s }),
  tour: z.object({
    title: s,
    destinations: s,
    start_date: s,
    end_date: s,
    adults: value,
    children: value,
    infants: value,
    hotel_category: s,
    departure_city: s,
  }),
  days: z.array(day),
  price: value,
  tax: value,
  tcs: value,
  adult_price: s,
  child_price: s,
  infant_price: s,
  valid_until: z.string(),
  inclusions: s,
  exclusions: s,
  hotel_details: s,
  transport_details: s,
  payment_schedule: s,
  cancellation_policy: s,
  travel_notes: s,
});
// Zod strips unknown keys at every object level. Never pass a database row directly to PDF/email.
export function customerQuote(input: unknown) {
  return snapshot.parse(input);
}
export type CustomerQuote = ReturnType<typeof customerQuote>;
