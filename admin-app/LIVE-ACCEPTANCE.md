# Live staging acceptance — NOT RUN

Use a dedicated configured Supabase staging project. This is an executable human acceptance procedure; it is not an automated browser suite. Record actual record IDs and observed results after each step. Do not mark PASS from local PGlite tests.

## First administrator
1. Create/select the agency-owned staging Supabase project.
2. Run migrations 001, 002, 003 once in order in its SQL Editor. Confirm no errors. Use a dedicated project because 001 revokes anonymous grants across the public schema.
3. Disable public registration in Auth. Create the owner's employee user through Auth, using a private password/reset process. Never paste credentials in chat.
4. Copy that user's UUID. In SQL Editor execute `insert into public.admin_profiles(id,display_name,role) values ('ACTUAL_UUID','Modi Holidays Administrator','admin');`.
5. Create a second Auth user and profile with role `staff` for authorization checks.
6. If .env.local does not exist, copy .env.example to it. Enter project URL and publishable key locally, and APP_ORIGIN. Never use a service-role key. Leave optional email/intake secrets unset until needed. Do not overwrite an existing environment file.
7. Run pnpm dev from admin-app, open /admin/login and sign in privately. Confirm dashboard access, logout, and denial after logout.

## Authenticated end-to-end test
Run ID: ______  Staging project: ______  Date: ______  Tester: ______
All test records must be labelled QA ONLY and must not be used as real offers.

1. Sign in as staff. Create QA enquiry with contact, destination, 2 adults, 1 child with age, rooms, future dates and follow-up. Save; record ID; reload and verify persisted values.
2. Convert to itinerary. Add 3 days, edit each description/hotel/transport, duplicate and reorder a day, remove the duplicate. Put QA_INTERNAL_SECRET in internal notes. Wait for Saved, sign out/in and reopen. Verify all content and order. Edit again and verify revision history.
3. Create quote V1 with explicitly synthetic hotel and transport costs totalling INR 10,000; contingency zero; markup 25%; tax/TCS zero for this QA case with explanatory tax notes. Expect pre-tax/final INR 12,500 and profit INR 2,500, margin 20%. Save, reload and check. Create V2 with margin 25%: expect INR 13,333.33. Confirm versions remain distinct.
4. As staff, approval must be denied. Draft PDF export must be denied. Sign in as admin, approve V1; record version ID. Confirm approved fields cannot be edited and a new version is needed.
5. Download PDF. Verify official logo, customer itinerary, INR 12,500, validity and terms. Search extracted text for QA_INTERNAL_SECRET, supplier costs and profit; none may appear. Verify pdf_exports row and private Storage object exist. Download again and compare SHA-256 hashes. Anonymous access to download and storage must fail.
6. Convert V1 into booking; expect Pending and value INR 12,500. Reload. Attempt duplicate conversion: reject. Record INR 2,500 advance: expect balance INR 10,000 and Advance Received, never Confirmed. Require explicit supplier confirmation before Confirmed transition. Reject overpayment.
7. Log out and verify private routes/APIs deny access. Deactivate staff profile using owner's SQL Editor; existing staff session must lose data access. Restore only if appropriate.
8. Reopen enquiry, itinerary, versions, PDF and booking after a fresh login. Confirm persisted links and audit events. Do not send email/WhatsApp or create real supplier confirmations during this test.

Evidence: record IDs, expected/actual totals, PDF hash, screenshots without credentials, denied-request status, tester/date. Keep evidence private. Result: NOT RUN until every step has actual evidence; record failures individually.

## Review observations
Authentication verifies Auth user and active employee profile on server; RLS gates private tables; workflow mutations use authorized RPCs; admin approval and private storage policies are present. Environment template contains no credentials. Live storage policy interactions with any pre-existing policies remain unverified. All employees currently share agency records. No live Supabase configuration was found locally, so no hosted database workflow is claimed to have passed.
