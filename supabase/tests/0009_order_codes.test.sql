-- 0009_order_codes.test.sql — run AFTER 0009_order_codes.sql
-- Expects "ALL TESTS PASSED" then rolls back all fixtures.
begin;

-- ---------- fixtures ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000201','authenticated','authenticated','hc-cust@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000201','authenticated','authenticated','hc-drv1@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000202','authenticated','authenticated','hc-drv2@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000201','authenticated','authenticated','hc-store@test.dev','',now(),now(),now(),'{}','{}');

insert into public.profiles (id, role, name) values
  ('c0000000-0000-4000-8000-000000000201','customer','HC Cust'),
  ('d0000000-0000-4000-8000-000000000201','driver','HC Drv1'),
  ('d0000000-0000-4000-8000-000000000202','driver','HC Drv2'),
  ('e0000000-0000-4000-8000-000000000201','store','HC Store');

insert into public.stores (id, name, approved, open)
  values ('e0000000-0000-4000-8000-000000000201','HC Store', true, true);

-- order insert → trigger must create the codes row
insert into public.orders (id, customer_id, store_id, driver_id, driver_name,
                           status, placed_at, timeline)
values ('T-HC-1','c0000000-0000-4000-8000-000000000201',
        'e0000000-0000-4000-8000-000000000201',
        'd0000000-0000-4000-8000-000000000201','HC Drv1',
        'driver_assigned', 1, '[]');

do $$
begin
  assert (select count(*) from public.order_codes where order_id = 'T-HC-1') = 1,
    'codes row not auto-created on order insert';
  assert (select pickup_code from public.order_codes where order_id = 'T-HC-1')
         ~ '^[0-9]{4}$', 'pickup code is not a 4-digit value';
end $$;

create or replace function pg_temp.set_actor(p uuid) returns void language sql as
$$ select set_config('request.jwt.claims',
     jsonb_build_object('sub', p::text, 'role', 'authenticated')::text, true)::void $$;

set local role authenticated;

-- 1. customer CAN read the codes
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000201');
do $$
declare r jsonb := public.order_code('T-HC-1');
begin
  assert (r->>'ok')::boolean, 'customer could not read codes: ' || r::text;
  assert (r->>'dropoff_code') ~ '^[0-9]{4}$', 'dropoff code missing';
end $$;

-- 2. store CAN read the codes
select pg_temp.set_actor('e0000000-0000-4000-8000-000000000201');
do $$
declare r jsonb := public.order_code('T-HC-1');
begin
  assert (r->>'ok')::boolean, 'store could not read codes: ' || r::text;
end $$;

-- 3. the assigned courier CANNOT read the codes (verify-only by design)
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000201');
do $$
declare r jsonb := public.order_code('T-HC-1');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'not_authorized',
    'courier could read handoff codes — verification is broken: ' || r::text;
end $$;

-- 4. wrong pickup code is rejected and status stays put
do $$
declare r jsonb := public.verify_order_code('T-HC-1', '0000', 'pickup');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'wrong_code',
    'wrong pickup code accepted: ' || r::text;
  assert (select status from public.orders where id = 'T-HC-1') = 'driver_assigned',
    'status moved on a wrong code';
end $$;

-- 5. unassigned driver cannot verify even with the right code
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000202');
do $$
declare r jsonb := public.verify_order_code(
    'T-HC-1', (select pickup_code from public.order_codes where order_id = 'T-HC-1'), 'pickup');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'not_courier',
    'unassigned driver verified the code: ' || r::text;
end $$;

-- 6. correct pickup code → picked_up (through the transition guard)
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000201');
do $$
declare r jsonb := public.verify_order_code(
    'T-HC-1', (select pickup_code from public.order_codes where order_id = 'T-HC-1'), 'pickup');
begin
  assert (r->>'ok')::boolean, 'correct pickup code rejected: ' || r::text;
  assert (select status from public.orders where id = 'T-HC-1') = 'picked_up',
    'status not picked_up after valid code';
end $$;

-- 7. pickup code does NOT work at drop-off
do $$
declare r jsonb := public.verify_order_code(
    'T-HC-1', (select pickup_code from public.order_codes where order_id = 'T-HC-1'), 'dropoff');
begin
  assert not (r->>'ok')::boolean and r->>'reason' = 'wrong_code',
    'pickup code accepted at drop-off';
end $$;

-- 8. correct drop-off code → delivered
do $$
declare r jsonb := public.verify_order_code(
    'T-HC-1', (select dropoff_code from public.order_codes where order_id = 'T-HC-1'), 'dropoff');
begin
  assert (r->>'ok')::boolean, 'correct dropoff code rejected: ' || r::text;
  assert (select status from public.orders where id = 'T-HC-1') = 'delivered',
    'status not delivered after valid code';
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
