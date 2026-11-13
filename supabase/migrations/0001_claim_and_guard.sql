-- 0001_claim_and_guard.sql
-- Race-safe order claiming + server-side transition enforcement.
-- Rollback: see bottom of file (commented block).

-- ---------- new columns (status_at/dispatch_attempts power step-3 sweeps) ----------
alter table public.orders add column if not exists status_at timestamptz not null default now();
alter table public.orders add column if not exists dispatch_attempts int not null default 0;
alter table public.orders add column if not exists cancel_reason text;

-- one active delivery per driver (driver_assigned/picked_up/en_route)
create unique index if not exists orders_one_active_per_driver
  on public.orders (driver_id)
  where status in ('driver_assigned', 'picked_up', 'en_route');

-- ---------- claim_order: atomic, race-safe courier assignment ----------
create or replace function public.claim_order(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_driver public.drivers%rowtype;
  v_order public.orders%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = v_uid and p.role = 'driver'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_a_driver');
  end if;

  select * into v_driver from public.drivers where id = v_uid::text;
  if not found or not v_driver.verified then
    return jsonb_build_object('ok', false, 'reason', 'not_verified');
  end if;
  if not v_driver.online then
    return jsonb_build_object('ok', false, 'reason', 'offline');
  end if;

  update public.orders
     set driver_id = v_uid::text,
         driver_name = v_driver.name,
         status = 'driver_assigned'
   where id = p_order_id
     and status = 'ready'
     and driver_id is null
  returning * into v_order;

  if found then
    return jsonb_build_object('ok', true, 'order', to_jsonb(v_order));
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unavailable');
  end if;
  if v_order.driver_id = v_uid::text then
    -- idempotent winner retry — returns the row even after status moved on
    return jsonb_build_object('ok', true, 'order', to_jsonb(v_order));
  end if;
  if v_order.driver_id is not null then
    return jsonb_build_object('ok', false, 'reason', 'already_taken');
  end if;
  return jsonb_build_object('ok', false, 'reason', 'unavailable');
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'busy');
end;
$$;

revoke all on function public.claim_order(text) from public, anon;
grant execute on function public.claim_order(text) to authenticated;

-- ---------- transition guard: validates who may change what ----------
-- BEFORE UPDATE (no column filter): the trigger whitelists changed columns per
-- actor because RLS controls rows, not columns.
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
begin
  v_is_system := v_actor is null; -- postgres/cron/service writes
  if v_actor is not null then
    select p.role into v_role from public.profiles p where p.id = v_actor;
    v_is_admin := v_role = 'admin';
  end if;

  /* ---- driver_id: set once via claim, immutable afterwards ---- */
  if NEW.driver_id is distinct from OLD.driver_id then
    if OLD.driver_id is not null then
      -- only admin reassignment or the system re-dispatch reset
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
      -- cron sweeps: cancellations + driver_assigned re-dispatch
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

  /* ---- non-status column whitelist ---- */
  if not (v_is_admin or v_is_system) then
    if NEW.id is distinct from OLD.id
       or NEW.customer_id is distinct from OLD.customer_id
       or NEW.customer_name is distinct from OLD.customer_name
       or NEW.customer_address is distinct from OLD.customer_address
       or NEW.customer_pos_x is distinct from OLD.customer_pos_x
       or NEW.customer_pos_y is distinct from OLD.customer_pos_y
       or NEW.store_id is distinct from OLD.store_id
       or NEW.store_name is distinct from OLD.store_name
       or NEW.store_pos_x is distinct from OLD.store_pos_x
       or NEW.store_pos_y is distinct from OLD.store_pos_y
       or NEW.items is distinct from OLD.items
       or NEW.subtotal is distinct from OLD.subtotal
       or NEW.delivery_fee is distinct from OLD.delivery_fee
       or NEW.service_fee is distinct from OLD.service_fee
       or NEW.surge_fee is distinct from OLD.surge_fee
       or NEW.discount is distinct from OLD.discount
       or NEW.tip is distinct from OLD.tip
       or NEW.total is distinct from OLD.total
       or NEW.promo_code is distinct from OLD.promo_code
       or NEW.placed_at is distinct from OLD.placed_at
       or NEW.eta_minutes is distinct from OLD.eta_minutes
       or NEW.dispatch_attempts is distinct from OLD.dispatch_attempts then
      raise exception 'order payload is immutable';
    end if;

    if (NEW.driver_pos_x is distinct from OLD.driver_pos_x
        or NEW.driver_pos_y is distinct from OLD.driver_pos_y
        or NEW.driver_progress is distinct from OLD.driver_progress)
       and v_actor::text is distinct from OLD.driver_id then
      raise exception 'only the assigned driver may update courier position';
    end if;

    if NEW.rating is distinct from OLD.rating
       and v_actor::text is distinct from OLD.customer_id then
      raise exception 'only the customer may rate the order';
    end if;

    if NEW.driver_name is distinct from OLD.driver_name
       and not (OLD.status = 'ready' and NEW.status = 'driver_assigned'
                and NEW.driver_id = v_actor::text) then
      raise exception 'driver_name is set by the claim';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists order_transition_guard on public.orders;
create trigger order_transition_guard
  before update on public.orders
  for each row execute function public.order_transition_guard();

-- ---------- RLS: remove self-assignment / arbitrary writes on unassigned rows ----------
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (
    customer_id = auth.uid()::text
    or store_id = auth.uid()::text
    or driver_id = auth.uid()::text
    or public.is_admin()
  );

/* ---------- ROLLBACK ----------
drop trigger if exists order_transition_guard on public.orders;
drop function if exists public.order_transition_guard();
drop function if exists public.claim_order(text);
drop index if exists public.orders_one_active_per_driver;
alter table public.orders
  drop column if exists status_at,
  drop column if exists dispatch_attempts,
  drop column if exists cancel_reason;
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (
    customer_id = auth.uid()::text or store_id = auth.uid()::text
    or driver_id = auth.uid()::text
    or (status = 'ready' and driver_id is null) or public.is_admin()
  );
*/
