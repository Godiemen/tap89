-- 0002_order_timeouts.sql
-- Timeout sweeps via pg_cron. Requires migration 0001 (status_at,
-- dispatch_attempts, cancel_reason columns + system-actor path in the guard).
-- Rollback: see bottom of file (commented block).

create extension if not exists pg_cron;

-- ---------- configurable windows (seconds) ----------
insert into public.settings (key, value) values
  ('accept_timeout_sec',  '90'::jsonb),   -- store must accept
  ('prep_timeout_sec',    '2700'::jsonb), -- store accepted but never readied
  ('courier_timeout_sec', '900'::jsonb),  -- ready order, no courier
  ('pickup_timeout_sec',  '1800'::jsonb)  -- courier assigned, never picked up
on conflict (key) do nothing;

-- ---------- the sweep ----------
-- Runs as postgres (cron) → auth.uid() is null → the guard treats it as
-- 'system', which may only cancel or re-dispatch.
create or replace function public.sweep_order_timeouts()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_accept  int := coalesce((select (value #>> '{}')::int from public.settings where key = 'accept_timeout_sec'), 90);
  v_prep    int := coalesce((select (value #>> '{}')::int from public.settings where key = 'prep_timeout_sec'), 2700);
  v_courier int := coalesce((select (value #>> '{}')::int from public.settings where key = 'courier_timeout_sec'), 900);
  v_pickup  int := coalesce((select (value #>> '{}')::int from public.settings where key = 'pickup_timeout_sec'), 1800);
  v_swept   int := 0;
  v_n       int;
begin
  -- store never acknowledged
  update public.orders
     set status = 'cancelled', cancel_reason = 'store_timeout'
   where status = 'placed'
     and status_at < now() - make_interval(secs => v_accept);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  -- store accepted but never marked ready
  update public.orders
     set status = 'cancelled', cancel_reason = 'store_abandoned'
   where status in ('accepted', 'preparing')
     and status_at < now() - make_interval(secs => v_prep);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  -- ready but nobody claimed it
  update public.orders
     set status = 'cancelled', cancel_reason = 'no_courier'
   where status = 'ready' and driver_id is null
     and status_at < now() - make_interval(secs => v_courier);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  -- courier assigned but never picked up: re-offer once, then cancel
  update public.orders
     set status = 'ready',
         driver_id = null,
         driver_name = null,
         driver_pos_x = null,
         driver_pos_y = null,
         driver_progress = null,
         dispatch_attempts = dispatch_attempts + 1
   where status = 'driver_assigned'
     and status_at < now() - make_interval(secs => v_pickup)
     and dispatch_attempts < 1;
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  update public.orders
     set status = 'cancelled', cancel_reason = 'no_courier'
   where status = 'driver_assigned'
     and status_at < now() - make_interval(secs => v_pickup)
     and dispatch_attempts >= 1;
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  -- NOTE: picked_up / en_route are intentionally NOT swept — a courier with
  -- the customer's order mid-trip needs a dispute flow (admin + refund),
  -- not silent cancellation.

  return v_swept;
end;
$$;

revoke all on function public.sweep_order_timeouts() from public, anon, authenticated;
grant execute on function public.sweep_order_timeouts() to postgres;

-- ---------- schedule ----------
do $$
begin
  perform cron.unschedule('sipdash-order-timeouts');
exception when others then null; -- first run: job doesn't exist yet
end $$;

select cron.schedule('sipdash-order-timeouts', '* * * * *',
  $cmd$select public.sweep_order_timeouts();$cmd$);

/* ---------- ROLLBACK ----------
do $$
begin
  perform cron.unschedule('sipdash-order-timeouts');
exception when others then null;
end $$;
drop function if exists public.sweep_order_timeouts();
delete from public.settings
 where key in ('accept_timeout_sec','prep_timeout_sec','courier_timeout_sec','pickup_timeout_sec');
*/
