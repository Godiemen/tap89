-- 0001_claim_and_guard.test.sql
-- Run AFTER 0001_claim_and_guard.sql. Everything is inside one transaction
-- and rolled back at the end — nothing persists.
--
--   SQL editor: paste + run, expect "ALL TESTS PASSED" then the rollback.
--   psql:       psql "$SUPABASE_DB_URL" -f supabase/tests/0001_claim_and_guard.test.sql
--
-- auth.uid() is simulated via the request.jwt.claims GUC (same value
-- Supabase's auth functions read), and `set role authenticated` makes RLS
-- apply exactly as it does for real API callers.

begin;

-- ---------- fixtures (as postgres — before set role) ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-cust@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-drv1@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000002','authenticated','authenticated','t-drv2@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000003','authenticated','authenticated','t-drv-unver@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000004','authenticated','authenticated','t-drv-off@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-store@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-admin@test.dev','',now(),now(),now(),'{}','{}');

insert into public.profiles (id, role, name) values
  ('c0000000-0000-4000-8000-000000000001','customer','T Cust'),
  ('d0000000-0000-4000-8000-000000000001','driver','T Drv1'),
  ('d0000000-0000-4000-8000-000000000002','driver','T Drv2'),
  ('d0000000-0000-4000-8000-000000000003','driver','T DrvUnv'),
  ('d0000000-0000-4000-8000-000000000004','driver','T DrvOff'),
  ('e0000000-0000-4000-8000-000000000001','store','T Store'),
  ('a0000000-0000-4000-8000-000000000001','admin','T Admin');

insert into public.drivers (id, name, verified, online) values
  ('d0000000-0000-4000-8000-000000000001','T Drv1', true,  true),
  ('d0000000-0000-4000-8000-000000000002','T Drv2', true,  true),
  ('d0000000-0000-4000-8000-000000000003','T DrvUnv',false,true),
  ('d0000000-0000-4000-8000-000000000004','T DrvOff',true, false);

insert into public.stores (id, name, approved, open)
  values ('e0000000-0000-4000-8000-000000000001','T Store', true, true);
insert into public.customers (id, name, email)
  values ('c0000000-0000-4000-8000-000000000001','T Cust','t-cust@test.dev');

insert into public.orders (id, customer_id, store_id, status, placed_at, timeline) values
  ('T-ORD-1','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','ready',  1,'[{"status":"placed","at":1}]'),
  ('T-ORD-2','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','ready',  2,'[]'),
  ('T-ORD-3','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','placed', 3,'[]'),
  ('T-ORD-4','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','placed', 4,'[]'),
  ('T-ORD-5','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','placed', 5,'[]'),
  ('T-ORD-6','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','ready',  6,'[]');

-- helper: switch actor. usage: select pg_temp.set_actor('<uuid>');
create or replace function pg_temp.set_actor(p uuid) returns void language sql as
$$ select set_config('request.jwt.claims',
     jsonb_build_object('sub', p::text, 'role', 'authenticated')::text, true)::void $$;

-- ---------- become an API caller ----------
set local role authenticated;

-- ================= CLAIM FLOW =================

-- 1. verified online driver claims a ready order
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
declare r jsonb := public.claim_order('T-ORD-1');
        o public.orders%rowtype;
begin
  assert (r->>'ok')::boolean, 'claim should succeed';
  select * into o from public.orders where id = 'T-ORD-1';
  assert o.driver_id = 'd0000000-0000-4000-8000-000000000001', 'driver_id not set';
  assert o.driver_name = 'T Drv1', 'driver_name should come from drivers.name';
  assert o.status = 'driver_assigned', 'status not driver_assigned';
  assert o.status_at is not null, 'status_at not maintained';
  assert jsonb_array_length(o.timeline) = 2
     and o.timeline->1->>'status' = 'driver_assigned', 'timeline not appended by trigger';
end $$;

-- 2. winner retry is idempotent
do $$
declare r jsonb := public.claim_order('T-ORD-1');
begin
  assert (r->>'ok')::boolean, 'winner retry must return the row, not an error';
end $$;

-- 3. a different driver gets already_taken
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000002');
do $$
declare r jsonb := public.claim_order('T-ORD-1');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'already_taken',
    'loser must get already_taken, got ' || r::text;
end $$;

-- 4. drv2 wins a different ready order
do $$
declare r jsonb := public.claim_order('T-ORD-2');
begin
  assert (r->>'ok')::boolean, 'drv2 should claim T-ORD-2';
end $$;

-- 5. one-active-delivery: drv2 claiming a third order → busy (unique index)
do $$
declare r jsonb := public.claim_order('T-ORD-6');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'busy',
    'expected busy from unique index, got ' || r::text;
end $$;

-- 6. customer cannot claim
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
declare r jsonb := public.claim_order('T-ORD-6');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'not_a_driver', 'customer must be rejected';
end $$;

-- 7. unverified / offline drivers rejected
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000003');
do $$
declare r jsonb := public.claim_order('T-ORD-6');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'not_verified', 'unverified must be rejected';
end $$;
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000004');
do $$
declare r jsonb := public.claim_order('T-ORD-6');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'offline', 'offline must be rejected';
end $$;

-- 8. nonexistent order → unavailable
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
declare r jsonb := public.claim_order('T-NOPE');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'unavailable', 'missing order must be unavailable';
end $$;

-- ================= RLS BYPASS ATTEMPTS =================

-- 9. driver tries to self-assign via direct UPDATE on a ready order → 0 rows
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
declare n int;
begin
  update public.orders
     set driver_id = 'd0000000-0000-4000-8000-000000000001', status = 'driver_assigned'
   where id = 'T-ORD-6';
  get diagnostics n = row_count;
  assert n = 0, 'driver bypassed RLS to self-assign';
end $$;

-- 10. customer touches a ready unassigned order → denied
-- (owns the row, so RLS passes it — the guard must reject ready→delivered;
-- a row the customer didn't own would be invisible and give 0 rows either way)
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
declare ok boolean := false; n int;
begin
  begin
    update public.orders set status = 'delivered' where id = 'T-ORD-6';
    get diagnostics n = row_count;
    ok := n > 0;
  exception when others then ok := false; end;
  assert not ok, 'customer delivered a ready unassigned order';
end $$;

-- ================= GUARD: INVALID TRANSITIONS =================

-- 11. customer self-delivers own placed order → trigger reject
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set status = 'delivered' where id = 'T-ORD-5';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'customer self-delivered own order';
end $$;

-- 12. assigned driver reassigns driver_id → immutable
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set driver_id = 'd0000000-0000-4000-8000-000000000002'
      where id = 'T-ORD-1';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'driver reassigned driver_id';
end $$;

-- 13. store rewrites order payload (total) → immutable
select pg_temp.set_actor('e0000000-0000-4000-8000-000000000001');
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set total = 1 where id = 'T-ORD-3';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'store rewrote order total';
end $$;

-- 14. store self-assigns as driver → driver_id rule rejects
do $$
declare ok boolean := false;
begin
  begin
    update public.orders
       set driver_id = 'e0000000-0000-4000-8000-000000000001', status = 'driver_assigned'
     where id = 'T-ORD-6';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'store self-assigned as driver';
end $$;

-- 15. non-assigned driver moves a claimed order → reject (drv1 owns ORD-1, drv2 tries)
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000002');
do $$
declare ok boolean := false; n int;
begin
  -- RLS already blocks drv2 from seeing ORD-1 for update; belt+braces either way
  begin
    update public.orders set status = 'picked_up' where id = 'T-ORD-1';
    get diagnostics n = row_count;
    ok := n > 0;
  exception when others then ok := false; end;
  assert not ok, 'non-assigned driver advanced another courier''s order';
end $$;

-- ================= GUARD: VALID TRANSITIONS =================

-- 16. store accepts then marks ready; timeline grows each time
select pg_temp.set_actor('e0000000-0000-4000-8000-000000000001');
do $$
declare o public.orders%rowtype;
begin
  update public.orders set status = 'accepted' where id = 'T-ORD-3';
  update public.orders set status = 'ready'    where id = 'T-ORD-3';
  select * into o from public.orders where id = 'T-ORD-3';
  assert o.status = 'ready' and jsonb_array_length(o.timeline) = 2,
    'store flow broken or timeline not appended';
end $$;

-- 17. customer cancels own placed order
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
begin
  update public.orders set status = 'cancelled' where id = 'T-ORD-4';
  assert (select status from public.orders where id = 'T-ORD-4') = 'cancelled',
    'customer cancel failed';
end $$;

-- 18. assigned driver updates courier position; other driver cannot
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
begin
  update public.orders set driver_pos_x = 51, driver_pos_y = 52 where id = 'T-ORD-1';
end $$;
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000002');
do $$
declare ok boolean := false; n int;
begin
  begin
    update public.orders set driver_pos_x = 60 where id = 'T-ORD-1';
    get diagnostics n = row_count;
    ok := n > 0;
  exception when others then ok := false; end;
  assert not ok, 'other driver moved courier position';
end $$;

-- 19. customer rates own order; driver cannot rate
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
begin
  update public.orders set rating = 5 where id = 'T-ORD-1';
end $$;
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
declare ok boolean := false; n int;
begin
  begin
    update public.orders set rating = 1 where id = 'T-ORD-1';
    get diagnostics n = row_count;
    ok := n > 0;
  exception when others then ok := false; end;
  assert not ok, 'driver rated an order';
end $$;

-- 20. driver flow end-to-end on own delivery
do $$
begin
  update public.orders set status = 'picked_up' where id = 'T-ORD-1';
  update public.orders set status = 'delivered' where id = 'T-ORD-1';
  assert (select status from public.orders where id = 'T-ORD-1') = 'delivered';
end $$;

-- ================= CONCURRENCY =================
-- Deterministic overlap needs two sessions (see claim_race.sh):
--   A: begin; set role authenticated; claims=drv1; select claim_order('T-RACE');
--      select pg_sleep(5); commit;      -- holds the row lock while "thinking"
--   B: (same, drv2)                     -- blocks on the lock, then loses
-- After A commits, B's UPDATE re-evaluates (READ COMMITTED) → 0 rows →
-- 'already_taken'. Exactly one winner, every time.

select 'ALL TESTS PASSED' as result;
rollback;
