-- 0008_geo.test.sql — run AFTER 0008_geo.sql
-- Expects "ALL TESTS PASSED" then rolls back all fixtures.
begin;

-- ---------- fixtures ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000101','authenticated','authenticated','g-cust@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000101','authenticated','authenticated','g-drv1@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000102','authenticated','authenticated','g-drv2@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000101','authenticated','authenticated','g-store@test.dev','',now(),now(),now(),'{}','{}');

insert into public.profiles (id, role, name) values
  ('c0000000-0000-4000-8000-000000000101','customer','G Cust'),
  ('d0000000-0000-4000-8000-000000000101','driver','G Drv1'),
  ('d0000000-0000-4000-8000-000000000102','driver','G Drv2'),
  ('e0000000-0000-4000-8000-000000000101','store','G Store');

insert into public.drivers (id, name, verified, online, lat, lng) values
  ('d0000000-0000-4000-8000-000000000101','G Drv1', true, true, -29.85, 31.02),
  ('d0000000-0000-4000-8000-000000000102','G Drv2', true, true, null, null);

insert into public.stores (id, name, approved, open, lat, lng)
  values ('e0000000-0000-4000-8000-000000000101','G Store', true, true, -29.86, 31.03);
insert into public.customers (id, name, email, lat, lng)
  values ('c0000000-0000-4000-8000-000000000101','G Cust','g-cust@test.dev', -29.84, 31.00);

-- order with real endpoint snapshot
insert into public.orders (id, customer_id, store_id, status, placed_at, timeline,
                           store_lat, store_lng, customer_lat, customer_lng)
values ('T-GEO-1','c0000000-0000-4000-8000-000000000101','e0000000-0000-4000-8000-000000000101',
        'ready', 1, '[]', -29.86, 31.03, -29.84, 31.00);

create or replace function pg_temp.set_actor(p uuid) returns void language sql as
$$ select set_config('request.jwt.claims',
     jsonb_build_object('sub', p::text, 'role', 'authenticated')::text, true)::void $$;

set local role authenticated;

-- 1. driver claims the order
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000101');
do $$
declare r jsonb := public.claim_order('T-GEO-1');
begin
  assert (r->>'ok')::boolean, 'claim failed: ' || r::text;
end $$;

-- 2. assigned driver CAN write real GPS coords
do $$
declare o public.orders%rowtype;
begin
  update public.orders
     set driver_lat = -29.8523, driver_lng = 31.0198
   where id = 'T-GEO-1';
  select * into o from public.orders where id = 'T-GEO-1';
  assert o.driver_lat = -29.8523 and o.driver_lng = 31.0198,
    'assigned driver could not write driver_lat/lng';
end $$;

-- 3. a different driver CANNOT write them
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000102');
do $$
declare ok boolean := false; n int;
begin
  begin
    update public.orders set driver_lat = -29.9, driver_lng = 31.9 where id = 'T-GEO-1';
    get diagnostics n = row_count;
    ok := n > 0;
  exception when others then ok := false; end;
  assert not ok, 'unassigned driver moved the courier fix';
end $$;

-- 4. the store CANNOT forge a courier position either
select pg_temp.set_actor('e0000000-0000-4000-8000-000000000101');
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set driver_lat = -29.9 where id = 'T-GEO-1';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'store forged courier position';
end $$;

-- 5. endpoint snapshots are immutable post-placement (customer can't move drop-off)
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000101');
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set customer_lat = -30.0, customer_lng = 31.5 where id = 'T-GEO-1';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'customer moved the drop-off after placement';
end $$;

-- 6. sweep re-dispatch clears the dead courier's real fix
-- (runs as postgres like pg_cron does — drop the authenticated role + JWT claim
--  so the guard sees a system write, not a spoofed actor)
reset role;
select set_config('request.jwt.claims', '', true);
do $$
declare o public.orders%rowtype;
begin
  -- age the assignment past pickup timeout as the system would
  update public.orders set status_at = now() - interval '2 hours' where id = 'T-GEO-1';
  perform public.sweep_order_timeouts();
  select * into o from public.orders where id = 'T-GEO-1';
  assert o.status = 'ready' and o.driver_id is null,
    'order not re-dispatched: ' || o.status;
  assert o.driver_lat is null and o.driver_lng is null,
    'stale courier coords not cleared on re-dispatch';
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
