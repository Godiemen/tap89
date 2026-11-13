-- 0009_order_codes.sql
-- Handoff verification: a courier must enter a 4-digit code at pickup (shown
-- to the store) and at drop-off (shown to the customer). Codes live in a
-- table that is NOT in the realtime publication and has NO client-facing
-- policies — couriers can never read them, only verify against them.
-- Rollback: see bottom of file.

create table if not exists public.order_codes (
  order_id     text primary key references public.orders(id) on delete cascade,
  pickup_code  char(4) not null,
  dropoff_code char(4) not null,
  created_at   timestamptz not null default now()
);

alter table public.order_codes enable row level security;
-- no policies = deny all direct access; the RPCs below are the only way in
revoke all on public.order_codes from public, anon, authenticated;

-- ---------- code generation on order insert ----------
create or replace function public.orders_make_codes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.order_codes (order_id, pickup_code, dropoff_code)
  values (
    NEW.id,
    lpad(floor(random() * 10000)::int::text, 4, '0'),
    lpad(floor(random() * 10000)::int::text, 4, '0')
  )
  on conflict (order_id) do nothing;
  return NEW;
end;
$$;

drop trigger if exists orders_make_codes on public.orders;
create trigger orders_make_codes
  after insert on public.orders
  for each row execute function public.orders_make_codes();

-- backfill codes for orders placed before this migration
insert into public.order_codes (order_id, pickup_code, dropoff_code)
select o.id,
       lpad(floor(random() * 10000)::int::text, 4, '0'),
       lpad(floor(random() * 10000)::int::text, 4, '0')
  from public.orders o
on conflict (order_id) do nothing;

-- ---------- read codes: parties only (customer + store + admin) ----------
-- the assigned courier is deliberately NOT a reader — they verify, not read.
create or replace function public.order_code(p_order_id text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role  text;
  v_order public.orders%rowtype;
  v_codes public.order_codes%rowtype;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  select role into v_role from public.profiles where id = v_actor;
  if v_actor::text is distinct from v_order.customer_id
     and v_actor::text is distinct from v_order.store_id
     and v_role is distinct from 'admin' then
    return jsonb_build_object('ok', false, 'reason', 'not_authorized');
  end if;
  select * into v_codes from public.order_codes where order_id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_codes');
  end if;
  return jsonb_build_object(
    'ok', true,
    'pickup_code', v_codes.pickup_code,
    'dropoff_code', v_codes.dropoff_code
  );
end;
$$;

revoke all on function public.order_code(text) from public, anon;
grant execute on function public.order_code(text) to authenticated;

-- ---------- verify + transition: assigned courier only ----------
-- p_step: 'pickup' (driver_assigned -> picked_up) or 'dropoff' (-> delivered).
-- the status write goes through the normal UPDATE path so the transition
-- guard still enforces legality for the driver actor.
create or replace function public.verify_order_code(
  p_order_id text,
  p_code text,
  p_step text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.orders%rowtype;
  v_codes public.order_codes%rowtype;
  v_expected text;
  v_next text;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_order.driver_id is distinct from v_actor::text then
    return jsonb_build_object('ok', false, 'reason', 'not_courier');
  end if;

  if p_step = 'pickup' then
    if v_order.status <> 'driver_assigned' then
      return jsonb_build_object('ok', false, 'reason', 'wrong_state');
    end if;
    v_expected := (select pickup_code from public.order_codes where order_id = p_order_id);
    v_next := 'picked_up';
  elsif p_step = 'dropoff' then
    if v_order.status not in ('picked_up', 'en_route') then
      return jsonb_build_object('ok', false, 'reason', 'wrong_state');
    end if;
    v_expected := (select dropoff_code from public.order_codes where order_id = p_order_id);
    v_next := 'delivered';
  else
    return jsonb_build_object('ok', false, 'reason', 'bad_step');
  end if;

  if v_expected is null or v_expected <> p_code then
    return jsonb_build_object('ok', false, 'reason', 'wrong_code');
  end if;

  update public.orders set status = v_next where id = p_order_id
  returning * into v_order;

  return jsonb_build_object('ok', true, 'order', to_jsonb(v_order));
end;
$$;

revoke all on function public.verify_order_code(text, text, text) from public, anon;
grant execute on function public.verify_order_code(text, text, text) to authenticated;

/* ---------- ROLLBACK ----------
revoke all on function public.verify_order_code(text, text, text) from authenticated;
revoke all on function public.order_code(text) from authenticated;
drop function if exists public.verify_order_code(text, text, text);
drop function if exists public.order_code(text);
drop trigger if exists orders_make_codes on public.orders;
drop function if exists public.orders_make_codes();
drop table if exists public.order_codes;
*/
