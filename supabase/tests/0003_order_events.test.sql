-- 0003_order_events.test.sql
-- Run AFTER 0001 + 0002 + 0003. Everything rolls back — nothing persists.
-- auth.uid() simulated via request.jwt.claims; `set role authenticated`
-- makes RLS apply as it does for real callers.

begin;

-- ---------- fixtures ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-cust@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-store@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-4000-8000-000000000000','b0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-stranger@test.dev','',now(),now(),now(),'{}','{}');

insert into public.profiles (id, role, name) values
  ('c0000000-0000-4000-8000-000000000001','customer','T Cust'),
  ('e0000000-0000-4000-8000-000000000001','store','T Store'),
  ('b0000000-0000-4000-8000-000000000001','customer','T Stranger');

insert into public.stores (id, name, approved, open)
  values ('e0000000-0000-4000-8000-000000000001','T Store', true, true);
insert into public.customers (id, name, email) values
  ('c0000000-0000-4000-8000-000000000001','T Cust','t-cust@test.dev'),
  ('b0000000-0000-4000-8000-000000000001','T Stranger','t-stranger@test.dev');

create or replace function pg_temp.set_actor(p uuid) returns void language sql as
$$ select set_config('request.jwt.claims',
     jsonb_build_object('sub', p::text, 'role', 'authenticated')::text, true)::void $$;

set local role authenticated;

-- ---------- 1. INSERT writes a 'placed' event with actor ----------
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
insert into public.orders (id, customer_id, store_id, status, placed_at, timeline)
  values ('T-E1','c0000000-0000-4000-8000-000000000001',
          'e0000000-0000-4000-8000-000000000001','placed',1,'[]');
do $$
declare ev record;
begin
  select * into ev from public.order_events
   where order_id='T-E1' and status='placed';
  assert found, 'insert did not log placed event';
  assert ev.actor_id = 'c0000000-0000-4000-8000-000000000001'
     and ev.actor_role = 'customer', 'actor wrong: '||ev.actor_role;
end $$;

-- ---------- 2. status UPDATE logs event with from-status ----------
select pg_temp.set_actor('e0000000-0000-4000-8000-000000000001');
update public.orders set status='accepted' where id='T-E1';
do $$
declare ev record;
begin
  select * into ev from public.order_events
   where order_id='T-E1' and status='accepted';
  assert found, 'accept not logged';
  assert ev.actor_role='store' and ev.meta->>'from'='placed', 'event meta wrong';
end $$;

-- ---------- 3. customer cancel (placed only) logged as customer ----------
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
insert into public.orders (id, customer_id, store_id, status, placed_at, timeline)
  values ('T-E1b','c0000000-0000-4000-8000-000000000001',
          'e0000000-0000-4000-8000-000000000001','placed',1,'[]');
update public.orders set status='cancelled' where id='T-E1b';
do $$
begin
  assert exists (select 1 from public.order_events
    where order_id='T-E1b' and status='cancelled' and actor_role='customer'),
    'customer cancel not logged';
end $$;

-- ---------- 4. system write (sweep-style) logged as system ----------
reset role; -- postgres role
select set_config('request.jwt.claims', '', true); -- clear claims -> auth.uid() null -> 'system'
insert into public.orders (id, customer_id, store_id, status, placed_at, timeline)
  values ('T-E2','c0000000-0000-4000-8000-000000000001',
          'e0000000-0000-4000-8000-000000000001','ready',1,'[]');
update public.orders set status='cancelled', cancel_reason='no_courier' where id='T-E2';
do $$
declare ev record;
begin
  select * into ev from public.order_events
   where order_id='T-E2' and status='cancelled';
  assert found and ev.actor_role='system' and ev.meta->>'cancel_reason'='no_courier',
    'system cancel not logged with reason';
end $$;
set local role authenticated;

-- ---------- 5. RLS: parties read, stranger cannot ----------
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
declare n int;
begin
  select count(*) into n from public.order_events where order_id='T-E2';
  assert n >= 2, 'customer cannot read own order events';
end $$;
select pg_temp.set_actor('b0000000-0000-4000-8000-000000000001');
do $$
declare n int;
begin
  select count(*) into n from public.order_events where order_id='T-E2';
  assert n = 0, 'stranger read another customer''s events';
end $$;

-- ---------- 6. direct write denied ----------
do $$
declare ok boolean := false;
begin
  begin
    insert into public.order_events (order_id, status) values ('T-E2','delivered');
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'client forged an order event';
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
