-- 0005_contacts.test.sql
-- Run AFTER 0001–0005. Everything rolls back — nothing persists.

begin;

-- ---------- fixtures ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-cust@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-drv@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-store@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','x0000000-0000-4000-8000-000000000001','authenticated','authenticated','x-drv@test.dev','',now(),now(),now(),'{}','{}');

insert into public.profiles (id, role, name) values
  ('c0000000-0000-4000-8000-000000000001','customer','T Cust'),
  ('d0000000-0000-4000-8000-000000000001','driver','T Drv'),
  ('e0000000-0000-4000-8000-000000000001','store','T Store'),
  ('x0000000-0000-4000-8000-000000000001','driver','X Drv');
insert into public.drivers (id, name, phone, verified, online)
  values ('d0000000-0000-4000-8000-000000000001','T Drv','082-DRV',true,true),
         ('x0000000-0000-4000-8000-000000000001','X Drv','082-XXX',true,true);
insert into public.stores (id, name, phone, approved, open)
  values ('e0000000-0000-4000-8000-000000000001','T Store','021-STO',true,true);
insert into public.customers (id, name, email, phone)
  values ('c0000000-0000-4000-8000-000000000001','T Cust','t-cust@test.dev','082-CUS');

create or replace function pg_temp.set_actor(p uuid) returns void language sql as
$$ select set_config('request.jwt.claims',
     jsonb_build_object('sub', p::text, 'role', 'authenticated')::text, true)::void $$;

insert into public.orders (id, customer_id, store_id, driver_id, driver_name,
                           status, placed_at, timeline, status_at)
values ('T-C1','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001',
        'd0000000-0000-4000-8000-000000000001','T Drv','driver_assigned',1,'[]',now());

set local role authenticated;

-- ---------- party access ----------
do $$
declare
  r jsonb;
begin
  -- customer gets all three phones
  perform pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
  select public.order_contacts('T-C1') into r;
  assert r->>'ok' = 'true', 'customer denied';
  assert r->>'customer_phone' = '082-CUS'
     and r->>'store_phone' = '021-STO'
     and r->>'driver_phone' = '082-DRV', 'wrong phones: ' || r::text;

  -- store owner is also a party
  perform pg_temp.set_actor('e0000000-0000-4000-8000-000000000001');
  select public.order_contacts('T-C1') into r;
  assert r->>'ok' = 'true' and r->>'customer_phone' = '082-CUS', 'store denied';

  -- assigned driver is a party
  perform pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
  select public.order_contacts('T-C1') into r;
  assert r->>'ok' = 'true' and r->>'customer_phone' = '082-CUS', 'driver denied';
end $$;

-- ---------- non-party + anon denied ----------
do $$
declare r jsonb;
begin
  -- an unassigned driver (broadcast pool) gets nothing
  perform pg_temp.set_actor('x0000000-0000-4000-8000-000000000001');
  select public.order_contacts('T-C1') into r;
  assert r->>'ok' = 'false' and r->>'reason' = 'not_a_party',
    'unassigned driver read contacts: ' || r::text;

  -- anonymous caller denied outright
  perform set_config('request.jwt.claims', '', true);
  select public.order_contacts('T-C1') into r;
  assert r->>'ok' = 'false' and r->>'reason' = 'unauthenticated',
    'anon read contacts: ' || r::text;
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
