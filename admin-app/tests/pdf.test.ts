import { it, expect } from "vitest";
import fs from "node:fs";
it("renders the allowlisted customer DTO as an actual branded A4 PDF", async () => {
  // A clean checkout has no ignored public/ directory. pnpm test prepares it
  // using the same approved assets as development and production builds.
  const approvedLogo = fs.readFileSync("../assets/brand/logo-256.png");
  expect(fs.readFileSync("public/assets/brand/logo-256.png")).toEqual(
    approvedLogo,
  );
  await import("../scripts/pdf-smoke");
  const file = fs.readFileSync("../work/admin-pdf/qa-quotation.pdf");
  expect(file.subarray(0, 4).toString()).toBe("%PDF");
  expect(file.length).toBeGreaterThan(10000);
}, 60000);
