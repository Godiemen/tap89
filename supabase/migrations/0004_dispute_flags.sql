-- 0004_dispute_flags.sql
-- Dispute flagging for in-transit deliveries + guard hardening.
-- Requires 0001 (guard, status_at, columns) + 0002 (sweep, settings).
-- Rollback: see bottom of file (commented block).

insert into public.settings (key, value)
  values ('delivery_timeout_sec', '7200'::jsonb)
on conflict (key) do nothing;

alter table public.orders add column if not exists flagged boolean not null default false;
alter table public.orders add column if not exists flag_reason text;

-- ---------- guard: generic changed-column whitelist ----------
-- Replaces the explicit immutable-column list, which failed OPEN — any column
-- added later (e.g. flagged) was silently client-writable. Now only whitelisted
-- (actor, column) pairs are writable; everything else fails closed.
create or replace function public.order_transition_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_is_admin boolean := false;
  v_is_system boolean;
  v_allowed boolean;
  v_changed text[];
  v_allowed_cols text[];
begin
  v_is_system := v_actor is null; -- postgres/cron/service writes
  if v_actor is not null then
    select p.role into v_role from public.profiles p where p.id = v_actor;
    v_is_admin := v_role = 'admin';
  end if;

  /* ---- driver_id: set once via claim, immutable afterwards ---- */
  if NEW.driver_id is distinct from OLD.driver_id then
    if OLD.driver_id is not null then
      if not (
        v_is_admin
        or (v_is_system and NEW.driver_id is null
            and OLD.status = 'driver_assigned' and NEW.status = 'ready')
      ) then
        raise exception 'driver_id is immutable once set';
      end if;
    elsif not (
      OLD.status = 'ready' and NEW.status = 'driver_assigned'
      and NEW.driver_id = v_actor::text and v_role = 'driver'
    ) then
      raise exception 'driver_id can only be set by the claiming driver';
    end if;
  end if;

  /* ---- status transitions ---- */
  if NEW.status is distinct from OLD.status then
    v_allowed := false;
    if v_is_admin then
      v_allowed := true;
    elsif v_is_system then
      v_allowed :=
        (NEW.status = 'cancelled'
          and OLD.status in ('placed','accepted','preparing','ready','driver_assigned'))
        or (OLD.status = 'driver_assigned' and NEW.status = 'ready');
    elsif v_actor::text = OLD.store_id then
      v_allowed := case
        when OLD.status = 'placed'
             and NEW.status in ('accepted','rejected','cancelled') then true
        when OLD.status in ('accepted','preparing')
             and NEW.status in ('preparing','ready','cancelled') then true
        when OLD.status in ('ready','driver_assigned')
             and NEW.status = 'cancelled' then true
        else false end;
    elsif OLD.status = 'ready' and NEW.status = 'driver_assigned'
          and NEW.driver_id = v_actor::text and v_role = 'driver' then
      v_allowed := true; -- claim path (claim_order); driver_id checked above
    elsif v_actor::text = OLD.driver_id then
      v_allowed := case
        when OLD.status = 'driver_assigned' and NEW.status = 'picked_up' then true
        when OLD.status = 'picked_up' and NEW.status in ('en_route','delivered') then true
        when OLD.status = 'en_route' and NEW.status = 'delivered' then true
        else false end;
    elsif v_actor::text = OLD.customer_id then
      v_allowed := OLD.status = 'placed' and NEW.status = 'cancelled';
    end if;

    if not v_allowed then
      raise exception 'invalid order transition: % -> %', OLD.status, NEW.status;
    end if;

    -- trigger-owned bookkeeping; client-supplied values are discarded
    NEW.timeline := OLD.timeline
      || jsonb_build_object('status', NEW.status,
                            'at', (extract(epoch from now()) * 1000)::bigint);
    NEW.status_at := now();
    if not (v_is_system or v_is_admin) then
      NEW.cancel_reason := OLD.cancel_reason;
    end if;
  else
    NEW.timeline := OLD.timeline;
    NEW.status_at := OLD.status_at;
    NEW.cancel_reason := OLD.cancel_reason;
  end if;

  /* ---- generic column whitelist (fails closed for new columns) ---- */
  if not (v_is_admin or v_is_system) then
    select array_agg(k) into v_changed
      from jsonb_object_keys(to_jsonb(NEW)) k
     where to_jsonb(NEW) -> k is distinct from to_jsonb(OLD) -> k;

    -- columns governed by the dedicated checks above (lifecycle fields)
    v_allowed_cols := array[
      'status','driver_id','driver_name','timeline','status_at','cancel_reason'
    ];
    if v_actor::text = OLD.driver_id then
      v_allowed_cols := v_allowed_cols
        || array['driver_pos_x','driver_pos_y','driver_progress'];
    end if;
    if v_actor::text = OLD.customer_id then
      v_allowed_cols := v_allowed_cols || array['rating'];
    end if;

    if exists (
      select 1 from unnest(coalesce(v_changed, '{}')) c
      where not (c = any(v_allowed_cols))
    ) then
      raise exception 'column(s) not writable by this actor: %',
        (select string_agg(c, ', ') from unnest(v_changed) c
         where not (c = any(v_allowed_cols)));
    end if;
  end if;

  return NEW;
end;
$$;

-- ---------- sweep: flag (not cancel) stale in-transit deliveries ----------
create or replace function public.sweep_order_timeouts()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_accept   int := coalesce((select (value #>> '{}')::int from public.settings where key = 'accept_timeout_sec'), 90);
  v_prep     int := coalesce((select (value #>> '{}')::int from public.settings where key = 'prep_timeout_sec'), 2700);
  v_courier  int := coalesce((select (value #>> '{}')::int from public.settings where key = 'courier_timeout_sec'), 900);
  v_pickup   int := coalesce((select (value #>> '{}')::int from public.settings where key = 'pickup_timeout_sec'), 1800);
  v_delivery int := coalesce((select (value #>> '{}')::int from public.settings where key = 'delivery_timeout_sec'), 7200);
  v_swept    int := 0;
  v_n        int;
begin
  update public.orders
     set status = 'cancelled', cancel_reason = 'store_timeout'
   where status = 'placed'
     and status_at < now() - make_interval(secs => v_accept);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  update public.orders
     set status = 'cancelled', cancel_reason = 'store_abandoned'
   where status in ('accepted', 'preparing')
     and status_at < now() - make_interval(secs => v_prep);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  update public.orders
     set status = 'cancelled', cancel_reason = 'no_courier'
   where status = 'ready' and driver_id is null
     and status_at < now() - make_interval(secs => v_courier);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

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

  -- in-transit deliveries are FLAGGED for admin review, never auto-cancelled:
  -- the courier may have the customer's order. A human decides.
  update public.orders
     set flagged = true, flag_reason = 'stuck_delivery'
   where status in ('picked_up', 'en_route')
     and not flagged
     and status_at < now() - make_interval(secs => v_delivery);
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  return v_swept;
end;
$$;

revoke all on function public.sweep_order_timeouts() from public, anon, authenticated;
grant execute on function public.sweep_order_timeouts() to postgres;

/* ---------- ROLLBACK ----------
-- sweep/guard bodies revert to their 0001/0002 versions (re-run those files'
-- function blocks), then:
alter table public.orders drop column if exists flag_reason,
                           drop column if exists flagged;
delete from public.settings where key = 'delivery_timeout_sec';
*/
