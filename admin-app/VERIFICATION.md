# Admin Dashboard V1 verification record

Implementation branch: `feature/admin-dashboard-v1`, based on the existing approved logo/rebrand commit `6e4f975`. All existing history is preserved.

## Local checks

- Next.js 16.4.3 production build: passes (App Router, protected dynamic admin routes).
- TypeScript strict checking and ESLint: pass.
- 24 automated tests across pricing, PostgreSQL persistence/RLS/workflow, public intake and actual PDF generation: see final run result in delivery report.
- Public validator: 140 unique packages (88 Domestic, 9 Pilgrimage, 43 International), 155 pages, working local asset references, navigation/SEO/JSON-LD checks pass.
- Branding validator: approved logo hash unchanged; 280 destination photos byte-identical; catalogue, attribution, sitemap, SEO and original deployment workflow preserved. The validator now excludes main.js from its old exact-byte comparison because optional intake was intentionally added; catalogue.js remains checked.
- Unauthenticated /admin, /admin/enquiries and /admin/quotations/new redirect to setup/login. Next streamed redirects may use HTTP 200 with a NEXT_REDIRECT payload; browser navigation confirmed the login destination.
- /api/admin/health and private PDF/email APIs return 401 without employee authentication.
- Public intake returns 503 while unconfigured; public HTML/catalogue return 200.
- Real PostgreSQL tests cover wrong/null intake secrets, normalized customer details, idempotent retries, persisted throttling, deactivated staff denial and unapproved PDF registration denial.
- Actual synthetic QA quotation rendered as five A4 pages (595.28 x 841.89 points). All pages were rasterized and visually reviewed. Approved logo, destination photo, INR glyph, long descriptions, heading breaks, margins, customer terms and reference footer checked. PDF text bounding boxes remain within the A4 bounds; confidential sentinel fields do not appear.
- Browser login reviewed at desktop size and 390 x 844 mobile viewport; no horizontal overflow. No authenticated dashboard screen was fabricated.
- No customer email, WhatsApp message, live booking, production deploy or merge performed.

## Required owner acceptance

A live Supabase project was not supplied. Employee sessions, Supabase Storage policies (migration 002), complete authenticated UI workflow, provider email delivery and deployment-specific proxy/cookie behavior must be exercised on staging using actual admin and staff accounts. This is a prepared implementation, not a claim of completed live production acceptance. Follow README.md in this directory.

GitHub integration branch creation returned 403 Resource not accessible by integration. Local Git push found no stored GitHub username/credentials. No pull request URL exists yet; use the supplied Windows instructions with the owner's authentication.
