# SipDash × Supabase — go live

The four apps share one data layer (`packages/core`). Every app requires a
signed-in account — there is no mock/demo fallback. Signups write straight to
Postgres; Supabase Realtime keeps every open app in sync.

## 1. Create the database

In your Supabase project → **SQL Editor**:

1. Run `supabase/schema.sql` — creates tables, `profiles`, per-role RLS
   policies, realtime publication.
2. Run `supabase/seed.sql` — clears all tables and loads platform settings
   (`surge`, `platform_fee_pct`). Everything else starts empty.

Both files are idempotent — safe to re-run.

### Migrations

Incremental changes live in `supabase/migrations/NNNN_name.sql` — apply them in
order through the SQL editor (or `supabase db push` if the project is linked).
`schema.sql` is kept in sync as the fresh-install file, so a new environment
only needs schema + seed.

| File | What it does | Rollback |
|---|---|---|
| `0001_claim_and_guard.sql` | `claim_order()` RPC (race-safe courier assignment), tightened `orders_update` RLS, transition-guard trigger, `status_at`/`dispatch_attempts`/`cancel_reason` columns, one-active-delivery index | SQL block at file bottom |
| `0002_order_timeouts.sql` | pg_cron `sweep_order_timeouts()` (stale `placed`/`accepted`/`ready` auto-cancel, `driver_assigned` re-dispatch once then cancel), timeout `settings` keys | SQL block at file bottom |
| `0003_order_events.sql` | `order_events` audit table populated by trigger (actor + role + from-status + reason), backfilled from `orders.timeline`, party-scoped RLS | SQL block at file bottom |
| `0004_dispute_flags.sql` | `flagged`/`flag_reason` on stale `picked_up`/`en_route` orders (admin review, never auto-cancelled), `delivery_timeout_sec` key, guard rewritten as a closed column whitelist | SQL block at file bottom |
| `0005_contacts.sql` | `phone` on drivers/stores; `order_contacts(order_id)` RPC returns party phones only (keeps numbers out of the broadcast `ready` pool) | SQL block at file bottom |
| `0006_public_catalog.sql` | anon-select policies on approved stores, their products, active promos, settings — enables signed-out storefront browsing | SQL block at file bottom |
| `0007_store_ops.sql` | `orders.instructions` (write-once customer note), `stores.paused_until` + `open_hours`, pg_cron `sweep_store_state()` (auto-resume timed pauses, auto-pause outside hours) | SQL block at file bottom |
| `0008_geo.sql` | real `lat`/`lng` on stores/customers/drivers/orders (order snapshots both endpoints at placement); assigned driver writes `driver_lat/lng` through the guard; sweep clears them on re-dispatch | SQL block at file bottom |
| `0009_order_codes.sql` | `order_codes` table (not in realtime, deny-all RLS) with auto-generated 4-digit pickup/drop-off codes; `order_code()` read RPC (customer+store+admin); `verify_order_code()` courier-only RPC that transitions `picked_up`/`delivered` on code match | SQL block at file bottom |

### Tests

`supabase/tests/0001_claim_and_guard.test.sql` — run in the SQL editor after
the migration; expects `ALL TESTS PASSED` and rolls back all fixtures.
`supabase/tests/claim_race.sh` — two-session concurrency test (needs a
`SUPABASE_DB_URL` connection string).

## 2. Enable auth

Dashboard → **Authentication → Sign In / Providers**:

- Enable **Email** provider.
- For the smoothest prototype loop, disable **Confirm email**
  (Authentication → Sign In / Up → Email → toggle off "Confirm email").
  If you leave it on, signup still works — users confirm via email, then sign
  in; the profile/role rows are created automatically on first sign-in.

## 3. Configure the apps

Each app has `apps/<app>/.env.local` already created:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co   # ← fill this in
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...                # already set
```

Get the URL from **Project Settings → API → Project URL**.
Restart the dev servers after editing `.env.local`.

## 4. Accounts

Each app gates on its role — signing in with the wrong role shows an error:

| App | Sign up | Post-signup |
|---|---|---|
| `apps/customer` | name, email, password, phone, address + 21+ attestation | Immediately shops |
| `apps/driver` | name, email, password, vehicle, plate | **Pending** until admin verifies |
| `apps/store` | store name, email, password, address, categories | **Pending** until admin approves |
| `apps/admin` | sign-in only | Requires `role = 'admin'` |

### Granting admin access

Users can't self-register as admin. Create a normal auth user (Dashboard →
Authentication → Users → Add user, or sign up in any app), then promote them
in the SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

## 5. What syncs live

| Action | Writes to | Seen by |
|---|---|---|
| Customer places order | `orders` insert | That store's order rail, Admin monitor |
| Store accepts/rejects/readies | `orders` update | Customer tracking + notifications |
| Driver claims a ready order | `claim_order()` RPC → `orders` update | Customer tracking, Store, Admin |
| Driver pickup / delivered | `orders` update + `trips` insert | Customer tracking, Store, Admin |
| Driver GPS (during delivery) | `orders.driver_pos_*` (throttled 2s) | Customer tracking map |
| Admin surge / fees / approvals / promos | `settings`, `stores`, `drivers`, `promos` | All apps |
| Store menu / open / paused / prep time | `products`, `stores` | Customer catalog |
| Store/driver signup | `stores`/`drivers` insert (unapproved/unverified) | Admin approval queue |
| pg_cron sweep (1/min) | `orders` update (`cancelled`+`cancel_reason`, or re-dispatch) | Customer notification, Store, Admin |

Driver requests are derived client-side: any `ready` order with no `driver_id`
is offered to online verified drivers.

## 6. Prototype caveats

- **One account = one role row.** The entity id IS the auth uid
  (`stores.id`, `drivers.id`, `customers.id` = `auth.users.id`), so a user can
  only own one store / drive as one courier. Fine for a demo.
- **RLS is per-role but coarse.** Store owners could technically flip their own
  `approved` flag via a crafted request — the UI never offers it, but tighten
  with column-grants or a trigger before production.
- **Realtime publication broadcasts all changes** to authenticated clients
  regardless of RLS (Supabase publication behavior) — per-row privacy needs
  realtime authorization on `realtime.messages`.
- Driver assignment is atomic via `claim_order()` — losers get
  `already_taken`, and a driver can hold at most one active delivery.
- No password reset / profile editing UI yet.
