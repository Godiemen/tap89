-- 0007_store_ops.test.sql — run AFTER 0007_store_ops.sql
-- Expected: "ALL TESTS PASSED"
begin;

-- ---------- fixtures: two stores ----------
insert into public.stores (id, name, paused, paused_until, open_hours)
values
  ('T-S1', 'Timed Pause Co', true, now() - interval '5 minutes', null),   -- expired timer → resume
  ('T-S2', 'Manual Pause Co', true, null, null),                          -- manual → untouched
  ('T-S3', 'Late Night Co',   false, null, null),                         -- no hours → untouched
  ('T-S4', 'Banker Hours Co', false, null,
    -- only open 00:00-00:01 on whatever today is → definitely outside hours → auto-pause
    jsonb_build_object(lower(to_char(now() at time zone 'Africa/Johannesburg', 'dy')),
                       '["00:00","00:01"]'::jsonb)),
  ('T-S5', 'Weekday Only Co', false, null,
    -- has open_hours but NO entry for today → closed all day → auto-pause
    jsonb_build_object('__noday__', '["09:00","17:00"]'::jsonb));

do $$
declare
  v_swept int;
begin
  select public.sweep_store_state() into v_swept;
  assert v_swept >= 3, 'expected at least 3 stores swept, got ' || v_swept;

  assert (select paused from public.stores where id = 'T-S1') = false,
    'expired timed pause not resumed';
  assert (select paused_until from public.stores where id = 'T-S1') is null,
    'paused_until not cleared on resume';

  assert (select paused from public.stores where id = 'T-S2') = true,
    'manual pause was auto-resumed — must stay paused';
  assert (select paused from public.stores where id = 'T-S3') = false,
    'store without open_hours was touched';
  assert (select paused from public.stores where id = 'T-S4') = true,
    'store outside open_hours not auto-paused';
  assert (select paused from public.stores where id = 'T-S5') = true,
    'store with no open_hours entry for today not auto-paused';
end $$;

-- ---------- instructions column ----------
insert into public.orders (id, customer_id, customer_name, customer_address,
  store_id, store_name, items, subtotal, delivery_fee, service_fee, surge_fee,
  discount, tip, total, status, placed_at, eta_minutes, timeline, is_live,
  instructions)
values ('T-O1', 'T-C', 'Test Cust', '1 Road St', 'T-S1', 'Timed Pause Co',
  '[]'::jsonb, 10, 5, 1, 0, 0, 0, 16, 'placed', 0, 15, '[]'::jsonb, false,
  'no ice, ring twice')
on conflict (id) do nothing;

do $$
begin
  assert (select instructions from public.orders where id = 'T-O1') = 'no ice, ring twice',
    'instructions not persisted';
end $$;

rollback;
select 'ALL TESTS PASSED' as result;
