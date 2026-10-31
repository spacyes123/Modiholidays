import fs from "node:fs";
import path from "node:path";
import { customerQuote } from "../lib/customer-quote";
import { renderCustomerPdf } from "../lib/pdf";
const snapshot = {
  reference: "MH-Q-QA-ONLY-V1",
  title: "QA layout sample — not a live quotation",
  customer: {
    name: "QA Test Customer",
    mobile: "Test contact only",
    email: "qa@example.com",
  },
  tour: {
    title: "Kerala planning sample",
    destinations: "Munnar · Thekkady · Alleppey",
    start_date: "2027-02-01",
    end_date: "2027-02-04",
    adults: "2",
    children: "1",
    infants: "0",
    hotel_category: "Proposed only",
    departure_city: "Mumbai",
  },
  days: Array.from({ length: 5 }, (_, i) => ({
    position: i + 1,
    city: "Proposed stop",
    title: "Suggested travel day " + (i + 1),
    date: "",
    description:
      "This is a QA-only layout test. Sightseeing, timing, hotel arrangements and activities require confirmation in writing. ".repeat(
        i === 2 ? 18 : 4,
      ),
    hotel: "No hotel confirmed",
    meals: "As agreed in the written quote",
    sightseeing: "Proposed sightseeing subject to local access.",
    transport: "To be confirmed",
    pickup_drop: "To be agreed",
    optional_activities: "Only if requested and quoted",
    image: "assets/photos/mh-003.webp",
    internal_notes: "CONFIDENTIAL_DAY_NOTE",
  })),
  price: "39375.00",
  tax: "1875.00",
  tcs: "0.00",
  adult_price: "17000.00",
  child_price: "5375.00",
  infant_price: "",
  valid_until: "2099-12-31",
  inclusions:
    "QA-only sample wording. No live supplier inclusions are asserted.",
  exclusions: "Any service not expressly agreed in writing.",
  hotel_details: "No hotel booking or category has been confirmed.",
  transport_details: "Transport options require manual confirmation.",
  payment_schedule: "QA sample only. No payment is requested.",
  cancellation_policy: "The applicable policy must be agreed before booking.",
  travel_notes:
    "Sample for automated PDF layout and confidentiality testing only.",
  supplier_cost: "CONFIDENTIAL_SUPPLIER_COST",
  profit: "CONFIDENTIAL_MARGIN",
  internal_notes: "CONFIDENTIAL_NOTES",
};
const safe = customerQuote(snapshot);
if (JSON.stringify(safe).includes("CONFIDENTIAL"))
  throw Error("Confidential data leaked into customer DTO");
const bytes = await renderCustomerPdf(safe);
const out = path.resolve("../work/admin-pdf");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "qa-quotation.pdf"), bytes);
console.log(
  "Generated QA PDF:",
  bytes.length,
  "bytes; confidential fields excluded.",
);
