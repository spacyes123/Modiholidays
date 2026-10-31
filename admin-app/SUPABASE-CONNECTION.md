# Connect the dedicated Modi Holidays Supabase project

Target: https://tvbnhjihcbyeqkaocdda.supabase.co
Project reference: tvbnhjihcbyeqkaocdda

## Local configuration
The project URL has been written to admin-app/.env.local. Git ignores this file. The publishable key was not found; enter it locally using Notepad, never in chat:

```powershell
notepad 'C:\Users\Harsh\Documents\Codex\2026-10-29\new-chat\Modiholidays\admin-app\.env.local'
```
In Supabase's project Connect panel or API settings, copy the publishable key (or legacy anon key) to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Do not use a service-role or sb_secret key. Save the file. Keep APP_ORIGIN=http://localhost:3000 for local development.

## Dashboard steps, in order
1. Open the project and verify the reference tvbnhjihcbyeqkaocdda in its dashboard URL/settings. Project display names are not unique.
2. Confirm this is the intended dedicated project and whether any migrations have already run. Do not rerun these create-table migrations blindly.
3. Review the three existing migration files in admin-app/supabase/migrations. 001 creates the relational schema, RLS and workflow functions; 002 creates the private quotations bucket/policies; 003 creates dashboard metrics/view.
4. Before applying, confirm approval for this exact project. Migration 001 revokes ALL anonymous table grants across public: this can affect unrelated existing tables. There are no top-level DROP or TRUNCATE statements. DELETE statements occur inside save functions replacing itinerary days/draft costs, with revision/authorization checks. Use a fresh dedicated project; do not execute against an unrelated existing database.
5. After approval, run 001, 002, 003 in SQL Editor, in order, checking each result. Do not assume local PostgreSQL tests verify hosted Auth or Storage. Stop on any error and retain the error for diagnosis; do not reset the database.
6. In Authentication, disable new public signups. Keep email/password login enabled. Configure the local Site URL as http://localhost:3000 for this development project. Do not modify production Auth settings.
7. Under Auth Users, create the first administrator with an email you control. Set the password privately using Supabase's supported process. Copy the Auth user UUID; do not share the password.
8. In SQL Editor run the following with that UUID:

```sql
insert into public.admin_profiles(id,display_name,role)
values ('REPLACE_WITH_ACTUAL_AUTH_USER_UUID','Modi Holidays Administrator','admin');
```

9. Create a separate staff test user and an admin_profiles entry with role staff. Auth users alone must not gain dashboard access.
10. In Storage verify quotations has Public disabled, PDF-only MIME type, and 15 MB limit. Migration 002 does nothing to an existing bucket's configuration on conflict, so explicitly inspect an existing bucket. Confirm there are no additional public/broad policies on storage.objects that override intended privacy.
11. Start pnpm dev from admin-app and sign in at /admin/login. Restart an already running server after environment changes. Use the LIVE-ACCEPTANCE.md procedure for persisted enquiry → itinerary → quote → PDF → booking, role-denial and logout checks. Never mark a live test passed without evidence.

## Security review and limitations
The proxy refreshes Supabase sessions with getUser and cookie propagation. Server pages/actions and APIs independently check authenticated user and active admin_profiles membership. RLS covers customers, enquiries, itineraries, quotations, cost items and bookings. Sensitive workflow tables disallow ordinary authenticated writes; authorized RPCs handle those changes. Approval requires an admin. Private PDF policies require an active employee and approved version. All staff can read agency records, including internal supplier costs; these are not customer-accessible records.

Authentication refresh, hosted RLS, migration 002 against real Supabase Storage, PDF upload/download, and complete browser acceptance remain unverified until the key, migrations and real employee accounts are configured. Nothing was applied remotely, deployed or merged during preparation.
