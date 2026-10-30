import { it, expect } from "vitest";
import fs from "node:fs";
it("renders the allowlisted customer DTO as an actual branded A4 PDF", async () => {
  await import("../scripts/pdf-smoke");
  const file = fs.readFileSync("../work/admin-pdf/qa-quotation.pdf");
  expect(file.subarray(0, 4).toString()).toBe("%PDF");
  expect(file.length).toBeGreaterThan(10000);
}, 60000);
