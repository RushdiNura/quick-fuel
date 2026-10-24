# QuickFuel backend (Supabase)

This is the real backend matching Chapters 2–3 of the QuickFuel spec: schema,
RLS policies, scheduled jobs, and edge functions for reservation, mock
payment, dispensing, and refunds. I can't provision a live Supabase project
from this sandbox (no network access here), so you'll run these yourself —
it's a normal `supabase` CLI deploy, about 10 minutes end to end.

## 1. Create the project
1. Go to https://supabase.com/dashboard → New project.
2. Note the **Project URL**, **anon key**, and **service_role key** (Settings → API).

## 2. Install the CLI and link
```bash
cd quickfuel-backend
npm install          # installs the supabase CLI as a local dev dependency
npx supabase login
npx supabase link --project-ref <your-project-ref>
```
(Prefer a global install instead? `npm install -g supabase` works too — the
`npm run` scripts below call `supabase` directly either way via `npx`.)

## 3. Push the schema
```bash
npm run db:push
3Mk/g*Aq2$S@W3T
3Mk/g*Aq2$S@W3T
rushdinurafita
```

admin@gmail.com
123456

This runs, in order: `0001_schema.sql` (tables), `0002_rls.sql` (row-level
security), `0003_cron.sql` (pg_cron jobs), `0004_seed.sql` (car classes +
fuel types), `0005_helpers.sql` (a small RPC used by `/reserve`),
`0006_rate_limits.sql` (rate limiting table + RPC, used by `/reserve` and
`/verify-code`).

> pg_cron needs the `pg_cron` extension enabled — Supabase turns this on by
> default on new projects. If `supabase db push` errors on `create extension
> pg_cron`, enable it once in Dashboard → Database → Extensions, then re-run.

## 4. Deploy the edge functions
```bash
npm run deploy          # deploys all nine functions
# or one at a time, e.g.:
npm run deploy:reserve
```
Each function reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` — Supabase injects these automatically for
deployed functions, no manual env setup needed.

## 5. Create your first admin
The system is admin-only registration (no public sign-up), so the very first
account has to be created directly:
```sql
-- run in the SQL editor, after creating the auth user via
-- Dashboard → Authentication → Add user (or supabase auth admin create)
insert into profiles (id, name, email, role)
values ('<auth-user-uuid>', 'Admin', 'admin@quickfuel.et', 'admin');
```
After that, the admin can call `/create-user` for every other account
(drivers, station owners, operators) and the temp password comes back in the
response.

## 6. Wire up the frontend
In the demo app (or your real React/TS frontend), set:
```
VITE_SUPABASE_URL=<your project URL>https://hr-report-system-frontend.vercel.app/
VITE_SUPABASE_ANON_KEY=<anon key>
```
and call the edge functions at `${SUPABASE_URL}/functions/v1/<name>` with the
user's JWT in the `Authorization: Bearer <token>` header (this is what
`supabase.auth.getSession()` gives you client-side).

## What's implemented vs. what's still mock
- Real: schema, RLS, quota enforcement, inventory deduction, pickup codes,
  two-step dispensing, refund approval workflow, scheduled jobs, station
  registration, rate limiting on `/reserve` and `/verify-code`, and a full
  audit trail in `system_activity` (every write action is logged).
- Still mock (matches the spec's stated limitations): `/mock-payment` doesn't
  call Telebirr/Chapa — swap in their real API before production. Push
  notifications aren't wired to a delivery service (VAPID keys + a push
  provider like Firebase or OneSignal are needed — this is genuinely
  external infrastructure, not something to fake). No SMS. No custom domain
  (a DNS + hosting decision on your end, not code). Automated daily backups
  are a Supabase dashboard setting (Settings → Database → Backups on a paid
  plan), not something a migration can turn on.

## Files
```
package.json          # npm scripts wrapping the Supabase CLI (see below)
supabase/
  functions/deno.json  # Deno compiler/lint/fmt config for the functions
  migrations/
    0001_schema.sql
    0002_rls.sql
    0003_cron.sql
    0004_seed.sql
    0005_helpers.sql
    0006_rate_limits.sql
  functions/
    _shared/cors.ts
    create-user/index.ts
    create-station/index.ts
    reserve/index.ts
    mock-payment/index.ts
    verify-code/index.ts
    dispense-authorise/index.ts
    dispense-complete/index.ts
    request-refund/index.ts
    approve-refund/index.ts
```
