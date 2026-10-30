# Modi Holidays operations dashboard V1

This is a new Next.js App Router application inside the existing static website repository. The original site was plain HTML/CSS/JavaScript on GitHub Pages with no database, authentication or server runtime. `scripts/prepare-public.mjs` copies the approved public site into ignored `public/` without changing its pages, catalogue, photos, SEO or logo. The existing Pages deployment workflow is unchanged. GitHub Pages cannot execute this dashboard.

## Local setup (Windows PowerShell)

Install Node.js 24 and pnpm 11. From this directory:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
# Edit .env.local locally; never commit credentials.
pnpm dev
```

Open http://localhost:3000/admin/login. Missing Supabase configuration deliberately shows a setup notice and denies private routes. There is no demo login or public staff signup.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: owner's Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key, protected by database RLS. No service-role key is used.
- `APP_ORIGIN`: exact Next host origin, HTTPS in production.

Optional public form intake: `PUBLIC_ENQUIRY_SECRET`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Optional email: `RESEND_API_KEY` and a provider-verified `QUOTE_FROM_EMAIL`. These server secrets must stay in local/deployment secret storage. The business email remains unconfigured until the owner supplies it.

## Supabase provisioning

Use a dedicated Supabase project or review conflicts before applying to an existing database. Apply once, in order, through Supabase SQL Editor or the CLI migration workflow:

1. `supabase/migrations/001_operations.sql`: relational schema, constraints, RLS, audit triggers and transactional workflow RPCs.
2. `002_private_pdf_storage.sql`: private quotations bucket and employee-only approved-version storage policies.
3. `003_dashboard.sql`: employee-authorized database aggregate metrics and quotation status view.

These migrations create schema/settings only, with no customers, supplier rates or bookings. Back up an existing database first; no destructive reset is required. Use a staging project to validate migrations before production.

In Supabase Auth, disable public user registration. Create/invite employees using the owner's Auth dashboard. Set their password securely through Auth's supported flow. Add each actual Auth user UUID in SQL Editor:

```sql
insert into public.admin_profiles(id,display_name,role)
values ('REPLACE_WITH_AUTH_USER_UUID','Employee name','admin');
-- Use role 'staff' for ordinary employees.
-- Revoke access without deleting history:
-- update public.admin_profiles set active=false where id='ACTUAL_UUID';
```

No shared default passwords. An Auth account without an active profile has no employee access. Staff can operate agency records but only admins approve quotations, change minimum margins and read audit history. All active staff share access to the agency's records in V1; this is not an assigned-agent-only multi-tenant system. Configure Auth URLs to the chosen HTTPS host; no application signup/reset screen is provided in V1.

## Optional public enquiry capture

The existing form continues to prepare a manual WhatsApp enquiry when capture is unconfigured. To persist public enquiries, serve the site on the Next host, configure Turnstile for its hostname with action `enquiry`, set the variables above, then set `assets/config.js` publicEnquiryEndpoint to `/api/public/enquiries` and turnstileSiteKey to the public key. Rebuild to copy that config into the Next public files.

Generate a separate random ingress secret in your password manager. Store the same value only in the server environment. In the owner's SQL Editor, initialize its hash using a bound/local value (do not commit the literal):

```sql
insert into private.ingress_settings(id,secret_hash)
values(true,encode(sha256(convert_to('REPLACE_LOCALLY_WITH_RANDOM_SECRET','UTF8')),'hex'))
on conflict(id) do update set secret_hash=excluded.secret_hash;
```

Verify the table/column definition in migration 001 when provisioning. Requests require same origin, valid CAPTCHA, bounded fields and a honeypot. A persisted idempotency UUID prevents retries creating duplicates; eight new submissions per hashed source/hour are allowed. Deploy behind a trusted reverse proxy that overwrites client IP headers; otherwise source-based limits are less reliable. The private ingress schema and hashed keys are unavailable to browser roles. No customer gets private record links. No enquiry is represented as a confirmed booking.

## Working flows

1. Create enquiry, capture traveller ages/rooms/contact, assign staff, set follow-up and log communications. Lost status requires a reason.
2. Create linked itinerary. Edit all day fields; add, duplicate, remove and drag reorder days (Earlier/Later buttons also work). Select any of the 140 existing catalogue itineraries as a draft template, or save an internal template. Templates include descriptions/photos, never invented supplier costs. Nights are derived as days minus one in V1. Existing enquiry linkage is immutable; duplicate to create an itinerary for another enquiry.
3. Autosave starts only after a persisted itinerary exists. Visible status reports validation/errors; revision conflicts reject stale saves. Historical revisions are retained and available for review. Customer preview explicitly excludes internal day notes.
4. Create quotation and alternatives/versions. Enter real recorded costs, quantities, room nights and currency/FX. Recorded rates are editable and have provenance/verification/expiry dates. Previously saved quote costs remain their historical snapshot.
5. Pricing uses Decimal.js and independently recomputes with PostgreSQL numeric at approval: markup = cost*(1+rate), margin = cost/(1-rate). Line totals round to paise before aggregation. Contingency is explicit. Taxes and TCS bases/rates are transaction-specific inputs, with notes; no universal tax rule is implied. Profit excludes collected taxes. Optional adult/child/infant allocations must reconcile to final total; no equal split is invented.
6. Administrator approval validates costs, dates, minimum margin/override reason and required disclosures. Approved versions and public snapshots are immutable. Create a new version to change one.
7. Download PDF only after approval. A nested allowlist removes supplier costs, internal notes and margins. A4 PDF uses approved artwork, existing photos and bundled OFL Noto Sans. The first export is saved privately with its SHA-256; future downloads reuse it and verify integrity. Historical PDFs remain downloadable when validity expires; sending/conversion requires a valid quote.
8. Copy summary or open a prefilled WhatsApp message, then attach the downloaded file manually. Mark sent explicitly. Optional Resend sends only on the employee's button action to the saved customer email and uses an idempotency key; provider acceptance does not prove delivery.
9. Convert an approved valid version to one booking. Record payments and see balance/due date. Advance payment only changes Pending to Advance Received. Confirmation requires explicit supplier-confirmed status and a separate workflow action; payments never automatically confirm travel.

## Verification

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

24 automated tests pass in this workspace. Vitest tests use isolated PostgreSQL via PGlite and synthetic QA-only fixtures, never deployment seed data. They cover RLS/roles, persisted enquiry/itinerary revisions, version approval, decimal pricing, PDF allowlisting/rendering, booking/payment rules and invalid inputs. The PDF smoke test writes ignored `../work/admin-pdf/qa-quotation.pdf`; it is not a real offer. The storage migration requires Supabase's storage schema and must additionally be tested against the staging project.

Before acceptance, run with two actual employee accounts (admin/staff): login/logout, refresh sessions, create enquiry, edit/reopen itinerary, compare versions, reject staff approval, approve as admin, save/download/reopen PDF, manually share, convert booking and record payments. Test storage denied to anonymous/unprovisioned/deactivated users, and cross-browser/mobile authenticated forms. No authenticated end-to-end claim is made until that configured-project exercise passes.

## Deployment preparation (no deployment performed)

Use a Node/Next-capable host with repository root directory `admin-app`, Node 24, install `pnpm install --frozen-lockfile`, build `pnpm build`, start `pnpm start`. The build needs the parent repository's public assets available; do not upload only admin-app without its parent public sources. Review host repository root access restrictions. Use private environment variables, HTTPS, no preview secrets for untrusted forks, and a stable APP_ORIGIN. Ensure fonts and public assets are included in runtime tracing. Validate a staging deployment first.

For `/admin` on modiholidays.in, the owner must either move the entire hostname to this Next runtime (which also serves copied existing public pages), or configure a reverse proxy to route /admin and API paths to it. A subdomain is another option but public intake origin rules/configuration must be reviewed accordingly. Do not point the existing domain or change Pages deployment automatically. CI added for checks only, with no deployment job.

## Known limits / operational handover

- Live Supabase/Auth/Storage, sender configuration, hostname migration and actual employee acceptance require owner setup. Fail-closed screens and local database tests do not replace live integration testing.
- No supplier inventory, live rates, payment gateway, WhatsApp automatic attachment, delivery tracking or fabricated confirmations.
- No destructive record-delete UI; retain linked financial/audit history. Employee account recovery/provisioning is managed by the owner in Supabase. No MFA enrollment UI in V1.
- List pages batch-load all records before filtering; suitable for an initial internal agency deployment. Add indexed server-side pagination before high-volume use. PDF race requests may register multiple immutable export records; normal subsequent downloads select the first saved version.
- Configure backups, retention, customer privacy/access procedures and monitoring for the chosen host/database. Do not log request secrets or customer payloads. Rate-limit Auth at the provider/host and monitor failed access attempts.
- Dates display as ISO; dashboard follow-ups/departures use Asia/Kolkata. Verify business tax inputs and customer terms for each transaction with the agency's responsible reviewer.
