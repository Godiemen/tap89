-- 0002_order_timeouts.test.sql
-- Run AFTER 0001 + 0002. Everything rolls back — nothing persists.
-- The sweep runs as postgres → auth.uid() is null → 'system' actor, which is
-- exactly what the cron job will be. No role/claims needed in this file.

begin;

-- ---------- fixtures ----------
insert into public.orders (id, customer_id, store_id, status, placed_at,
                           timeline, status_at, dispatch_attempts, driver_id, driver_name) values
  -- stale placed → store_timeout
  ('T-T1','c','s','placed', 1,'[]', now() - interval '10 minutes', 0, null, null),
  -- stale accepted → store_abandoned
  ('T-T2','c','s','accepted',1,'[]', now() - interval '1 hour',     0, null, null),
  -- stale preparing → store_abandoned
  ('T-T3','c','s','preparing',1,'[]', now() - interval '1 hour',    0, null, null),
  -- stale ready, no driver → no_courier
  ('T-T4','c','s','ready',   1,'[]', now() - interval '30 minutes', 0, null, null),
  -- stale driver_assigned, first abandonment → re-dispatch
  ('T-T5','c','s','driver_assigned',1,'[]', now() - interval '1 hour', 0,
          'd0000000-0000-4000-8000-000000000001','X'),
  -- stale driver_assigned, already re-dispatched once → no_courier
  ('T-T6','c','s','driver_assigned',1,'[]', now() - interval '1 hour', 1,
          'd0000000-0000-4000-8000-000000000002','Y'),
  -- fresh placed → untouched
  ('T-T7','c','s','placed',  1,'[]', now(),                          0, null, null),
  -- stale picked_up → documented gap, must NOT be swept
  ('T-T8','c','s','picked_up',1,'[]', now() - interval '3 hours',    0,
          'd0000000-0000-4000-8000-000000000003','Z'),
  -- ready but already claimed (edge: driver_id set while status still ready)
  ('T-T9','c','s','ready',   1,'[]', now() - interval '30 minutes', 0,
          'd0000000-0000-4000-8000-000000000009','W');

-- ---------- run the sweep ----------
do $$
declare n int := public.sweep_order_timeouts();
begin
  assert n >= 5, 'expected at least 5 rows swept, got ' || n;
end $$;

-- ---------- assertions ----------
do $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where id='T-T1';
  assert o.status='cancelled' and o.cancel_reason='store_timeout', 'T-T1 wrong: '||o.status;
  select * into o from public.orders where id='T-T2';
  assert o.status='cancelled' and o.cancel_reason='store_abandoned', 'T-T2 wrong';
  select * into o from public.orders where id='T-T3';
  assert o.status='cancelled' and o.cancel_reason='store_abandoned', 'T-T3 wrong';
  select * into o from public.orders where id='T-T4';
  assert o.status='cancelled' and o.cancel_reason='no_courier', 'T-T4 wrong';
  select * into o from public.orders where id='T-T5';
  assert o.status='ready' and o.driver_id is null and o.driver_name is null
     and o.dispatch_attempts = 1, 'T-T5 re-dispatch wrong';
  select * into o from public.orders where id='T-T6';
  assert o.status='cancelled' and o.cancel_reason='no_courier', 'T-T6 wrong';
  select * into o from public.orders where id='T-T7';
  assert o.status='placed', 'T-T7 must survive (fresh)';
  select * into o from public.orders where id='T-T8';
  -- 0004: in-transit orders are flagged for admin review, never auto-cancelled
  assert o.status='picked_up' and o.flagged and o.flag_reason='stuck_delivery',
    'T-T8 should be flagged stuck_delivery, still picked_up';
  select * into o from public.orders where id='T-T9';
  assert o.status='ready', 'T-T9 claimed-but-ready must survive';
end $$;

-- trigger-side proof: swept rows got timeline + status_at maintenance
do $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where id='T-T1';
  assert jsonb_array_length(o.timeline) >= 1
     and o.timeline->-1->>'status' = 'cancelled', 'swept cancel not logged in timeline';
  assert o.status_at > now() - interval '1 minute', 'status_at not refreshed';
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
