-- 0004_dispute_flags.test.sql
-- Run AFTER 0001–0004. Everything rolls back — nothing persists.

begin;

-- ---------- fixtures ----------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','c0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-cust@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-drv@test.dev','',now(),now(),now(),'{}','{}'),
  ('00000000-0000-0000-0000-000000000000','e0000000-0000-4000-8000-000000000001','authenticated','authenticated','t-store@test.dev','',now(),now(),now(),'{}','{}');

insert into public.profiles (id, role, name) values
  ('c0000000-0000-4000-8000-000000000001','customer','T Cust'),
  ('d0000000-0000-4000-8000-000000000001','driver','T Drv'),
  ('e0000000-0000-4000-8000-000000000001','store','T Store');
insert into public.drivers (id, name, verified, online)
  values ('d0000000-0000-4000-8000-000000000001','T Drv', true, true);
insert into public.stores (id, name, approved, open)
  values ('e0000000-0000-4000-8000-000000000001','T Store', true, true);
insert into public.customers (id, name, email)
  values ('c0000000-0000-4000-8000-000000000001','T Cust','t-cust@test.dev');

create or replace function pg_temp.set_actor(p uuid) returns void language sql as
$$ select set_config('request.jwt.claims',
     jsonb_build_object('sub', p::text, 'role', 'authenticated')::text, true)::void $$;

insert into public.orders (id, customer_id, store_id, status, placed_at, timeline,
                           status_at, driver_id, driver_name) values
  -- stale picked_up → flag
  ('T-F1','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001',
   'picked_up',1,'[]', now() - interval '3 hours',
   'd0000000-0000-4000-8000-000000000001','T Drv'),
  -- fresh en_route → no flag (distinct driver — one_active_per_driver)
  ('T-F2','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001',
   'en_route',1,'[]', now(), 'drv-other-1','O Drv'),
  -- already flagged → not re-flagged (idempotent)
  ('T-F3','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001',
   'picked_up',1,'[]', now() - interval '5 hours', 'drv-other-2','O Drv2');
update public.orders set flagged = true, flag_reason = 'manual' where id = 'T-F3';

-- ---------- sweep flags stale in-transit only ----------
select set_config('request.jwt.claims', '', true); -- system actor
do $$
begin
  perform public.sweep_order_timeouts();
  assert (select flagged and flag_reason='stuck_delivery' and status='picked_up'
          from public.orders where id='T-F1'), 'T-F1 not flagged';
  assert (select not flagged and status='en_route'
          from public.orders where id='T-F2'), 'T-F2 flagged too early';
  assert (select flag_reason='manual' from public.orders where id='T-F3'),
    'T-F3 flag overwritten';
end $$;

-- ---------- whitelist: flag columns are not client-writable ----------
set local role authenticated;
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set flagged = false, flag_reason = 'hacked' where id = 'T-F1';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'customer cleared the flag';
end $$;
select pg_temp.set_actor('d0000000-0000-4000-8000-000000000001');
do $$
declare ok boolean := false;
begin
  begin
    update public.orders set flagged = false where id = 'T-F1';
    ok := true;
  exception when others then ok := false; end;
  assert not ok, 'driver cleared the flag';
end $$;

-- ---------- legit writes still work under the generic whitelist ----------
-- driver pos on assigned order
do $$
begin
  update public.orders set driver_pos_x = 55 where id = 'T-F1';
end $$;
-- customer rating
select pg_temp.set_actor('c0000000-0000-4000-8000-000000000001');
do $$
begin
  update public.orders set rating = 4 where id = 'T-F2';
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
