-- SipDash schema — run this in the Supabase SQL editor (project → SQL Editor → New query)
-- Then run seed.sql to load the platform settings.

create extension if not exists "pgcrypto";

-- ---------- Accounts ----------
-- Every signed-in user has exactly one profile row linking auth.users to a role.
-- The entity rows (customers / drivers / stores) use the auth user's UUID as
-- their primary key, so `id = auth.uid()::text` identifies "your" row.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'driver', 'store', 'admin')),
  name text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Catalog ----------
create table if not exists public.stores (
  id text primary key,                  -- = owner's auth.users id
  name text not null,
  emoji text not null default '🏪',
  categories text[] not null default '{}',
  rating numeric not null default 0,
  rating_count int not null default 0,
  delivery_time_min int not null default 15,
  delivery_time_max int not null default 30,
  delivery_fee numeric not null default 0,
  min_order numeric not null default 0,
  distance_km numeric not null default 0,
  address text not null default '',
  open boolean not null default false,
  paused boolean not null default false,
  prep_time_min int not null default 15,
  approved boolean not null default false,
  featured boolean not null default false,
  promo text,
  pos_x real not null default 50,
  pos_y real not null default 50,
  busy_level int not null default 0
);

create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  brand text not null default '',
  category text not null default 'extras',
  size text not null default '',
  abv numeric,
  price numeric not null default 0,
  image text not null default '📦',
  description text not null default '',
  tags text[] not null default '{}',
  available boolean not null default true,
  popular boolean not null default false
);

create table if not exists public.drivers (
  id text primary key,                  -- = driver's auth.users id
  name text not null,
  vehicle text not null default '',
  plate text not null default '',
  rating numeric not null default 5,
  trips int not null default 0,
  online boolean not null default false,
  verified boolean not null default false,
  pos_x real not null default 50,
  pos_y real not null default 50,
  avatar_color text not null default '#06C167'
);

create table if not exists public.customers (
  id text primary key,                  -- = customer's auth.users id
  name text not null,
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  pos_x real not null default 50,
  pos_y real not null default 50,
  age_verified boolean not null default false,
  orders_count int not null default 0,
  spent numeric not null default 0,
  joined text not null default '',
  status text not null default 'active' check (status in ('active', 'suspended'))
);

create table if not exists public.promos (
  code text primary key,
  description text not null default '',
  type text not null default 'percent' check (type in ('percent', 'flat', 'free_delivery')),
  value numeric not null default 0,
  min_subtotal numeric not null default 0,
  active boolean not null default true,
  uses int not null default 0
);

-- ---------- Orders ----------
create table if not exists public.orders (
  id text primary key,
  customer_id text not null,            -- customers.id (= auth uid)
  customer_name text not null default '',
  customer_address text not null default '',
  customer_pos_x real not null default 50,
  customer_pos_y real not null default 50,
  store_id text not null,               -- stores.id (= owner auth uid)
  store_name text not null default '',
  store_pos_x real not null default 50,
  store_pos_y real not null default 50,
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  service_fee numeric not null default 0,
  surge_fee numeric not null default 0,
  discount numeric not null default 0,
  tip numeric not null default 0,
  total numeric not null default 0,
  promo_code text,
  status text not null default 'placed' check (status in (
    'placed','accepted','preparing','ready','driver_assigned','picked_up','en_route','delivered','rejected','cancelled'
  )),
  placed_at bigint not null,
  eta_minutes int not null default 30,
  timeline jsonb not null default '[]',
  driver_id text,                       -- drivers.id (= driver auth uid)
  driver_name text,
  driver_pos_x real,
  driver_pos_y real,
  driver_progress real,
  rating int,
  is_live boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists orders_store_idx on public.orders (store_id, status);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status) where driver_id is null;

create table if not exists public.trips (
  id text primary key,
  order_id text not null,
  driver_id text not null default '',   -- drivers.id (= driver auth uid)
  driver_name text not null default '',
  store_name text not null default '',
  customer_address text not null default '',
  distance_km numeric not null default 0,
  payout numeric not null default 0,
  tip numeric not null default 0,
  at bigint not null,
  rating int
);

-- ---------- Platform settings (singleton key/value) ----------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);

-- ---------- Migrations for previously-created databases ----------
-- `create table if not exists` won't add new columns to existing tables,
-- so re-running this file upgrades them in place.
alter table public.stores    add column if not exists paused boolean not null default false;
alter table public.stores    add column if not exists prep_time_min int not null default 15;
alter table public.customers add column if not exists address text not null default '';
alter table public.customers add column if not exists pos_x real not null default 50;
alter table public.customers add column if not exists pos_y real not null default 50;
alter table public.trips     add column if not exists driver_id text not null default '';
alter table public.orders    alter column customer_id drop default; -- was 'me' in the old schema

-- ---------- Row level security ----------
-- Signed-in users only. No account → no data.
-- Admin check is a security-definer function so policies on profiles don't recurse.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

alter table public.profiles  enable row level security;
alter table public.stores    enable row level security;
alter table public.products  enable row level security;
alter table public.drivers   enable row level security;
alter table public.customers enable row level security;
alter table public.promos    enable row level security;
alter table public.orders    enable row level security;
alter table public.trips     enable row level security;
alter table public.settings  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','stores','products','drivers','customers','promos','orders','trips','settings'] loop
    execute format('drop policy if exists "anon_all" on public.%I', t);
  end loop;
end $$;

-- profiles: read your own (or everything as admin); create your own non-admin row;
-- role elevation happens only via SQL/dashboard (documented in README).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid() and role <> 'admin');
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (role <> 'admin' or public.is_admin());

-- stores: anyone (incl. signed-out browsers) sees approved stores;
-- owners and admins see their own/all.
drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores for select to authenticated
  using (approved or id = auth.uid()::text or public.is_admin());
drop policy if exists stores_select_anon on public.stores;
create policy stores_select_anon on public.stores for select to anon
  using (approved);
drop policy if exists stores_insert on public.stores;
create policy stores_insert on public.stores for insert to authenticated
  with check (id = auth.uid()::text and approved = false);
drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores for update to authenticated
  using (id = auth.uid()::text or public.is_admin());
drop policy if exists stores_delete on public.stores;
create policy stores_delete on public.stores for delete to authenticated
  using (public.is_admin());

-- products: readable when the parent store is visible; writable by the owner/admin.
drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated
  using (
    exists (select 1 from public.stores s where s.id = products.store_id and s.approved)
    or store_id = auth.uid()::text
    or public.is_admin()
  );
drop policy if exists products_select_anon on public.products;
create policy products_select_anon on public.products for select to anon
  using (exists (select 1 from public.stores s where s.id = products.store_id and s.approved));
drop policy if exists products_write on public.products;
create policy products_write on public.products for all to authenticated
  using (store_id = auth.uid()::text or public.is_admin())
  with check (store_id = auth.uid()::text or public.is_admin());

-- drivers: own row + admin (driver identity is denormalized onto orders/trips).
drop policy if exists drivers_select on public.drivers;
create policy drivers_select on public.drivers for select to authenticated
  using (id = auth.uid()::text or public.is_admin());
drop policy if exists drivers_insert on public.drivers;
create policy drivers_insert on public.drivers for insert to authenticated
  with check (id = auth.uid()::text and verified = false);
drop policy if exists drivers_update on public.drivers;
create policy drivers_update on public.drivers for update to authenticated
  using (id = auth.uid()::text or public.is_admin());
drop policy if exists drivers_delete on public.drivers;
create policy drivers_delete on public.drivers for delete to authenticated
  using (public.is_admin());

-- customers: own row + admin.
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select to authenticated
  using (id = auth.uid()::text or public.is_admin());
drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers for insert to authenticated
  with check (id = auth.uid()::text);
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update to authenticated
  using (id = auth.uid()::text or public.is_admin());
drop policy if exists customers_delete on public.customers;
create policy customers_delete on public.customers for delete to authenticated
  using (public.is_admin());

-- promos: everyone reads, admin writes.
drop policy if exists promos_select on public.promos;
create policy promos_select on public.promos for select to authenticated using (true);
drop policy if exists promos_select_anon on public.promos;
create policy promos_select_anon on public.promos for select to anon using (active);
drop policy if exists promos_write on public.promos;
create policy promos_write on public.promos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- orders: customer sees own; store sees its own; driver sees assigned or
-- ready-for-pickup; admin sees all.
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated
  using (
    customer_id = auth.uid()::text
    or store_id = auth.uid()::text
    or driver_id = auth.uid()::text
    or (status = 'ready' and driver_id is null)
    or public.is_admin()
  );
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to authenticated
  with check (customer_id = auth.uid()::text or public.is_admin());
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (
    customer_id = auth.uid()::text
    or store_id = auth.uid()::text
    or driver_id = auth.uid()::text
    or (status = 'ready' and driver_id is null)
    or public.is_admin()
  );
drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders for delete to authenticated
  using (public.is_admin());

-- trips: driver reads/inserts own; admin reads all.
drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips for select to authenticated
  using (driver_id = auth.uid()::text or public.is_admin());
drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips for insert to authenticated
  with check (driver_id = auth.uid()::text or public.is_admin());

-- settings: everyone reads platform config; admin writes.
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to authenticated using (true);
drop policy if exists settings_select_anon on public.settings;
create policy settings_select_anon on public.settings for select to anon using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Realtime ----------
-- Idempotent: skip tables already in the publication so this file can be re-run.
do $$
declare t text;
begin
  foreach t in array array['profiles','stores','products','drivers','customers','promos','orders','trips','settings'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
-- ---------- Order claim + transition guard (migration 0001) ----------
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

-- ---------- Order timeout sweeps (migration 0002) ----------
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

-- ---------- Order events audit trail (migration 0003) ----------
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  status text not null,
  actor_id uuid,                  -- null = system (cron/service)
  actor_role text not null default 'system',
  meta jsonb not null default '{}',
  at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id);

alter table public.order_events enable row level security;

-- readers: the parties of the order + admin. Writers: the trigger only
-- (it runs SECURITY DEFINER as postgres, bypassing RLS).
drop policy if exists order_events_select on public.order_events;
create policy order_events_select on public.order_events for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and (o.customer_id = auth.uid()::text
             or o.store_id = auth.uid()::text
             or o.driver_id = auth.uid()::text
             or public.is_admin())
    )
  );

revoke insert, update, delete on public.order_events from anon, authenticated;

-- ---------- writer ----------
create or replace function public.order_event_writer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
begin
  if v_actor is not null then
    select p.role into v_role from public.profiles p where p.id = v_actor;
  end if;
  v_role := coalesce(v_role, case when v_actor is null then 'system' else 'unknown' end);

  if TG_OP = 'INSERT' then
    insert into public.order_events (order_id, status, actor_id, actor_role)
    values (NEW.id, NEW.status, v_actor, v_role);
  elsif NEW.status is distinct from OLD.status then
    insert into public.order_events (order_id, status, actor_id, actor_role, meta)
    values (NEW.id, NEW.status, v_actor, v_role,
            jsonb_build_object('from', OLD.status,
                               'driver_id', NEW.driver_id,
                               'cancel_reason', NEW.cancel_reason));
  end if;
  return null; -- AFTER trigger: return value ignored
end;
$$;

drop trigger if exists order_event_writer on public.orders;
create trigger order_event_writer
  after insert or update of status on public.orders
  for each row execute function public.order_event_writer();

-- ---------- backfill existing rows from orders.timeline ----------
-- timeline.at is Date.now() epoch-milliseconds (verified across all writers).
insert into public.order_events (order_id, status, at)
select o.id, e ->> 'status',
       to_timestamp((e ->> 'at')::bigint / 1000.0)
from public.orders o,
     lateral jsonb_array_elements(o.timeline) e
where e ? 'at' and e ? 'status'
  and not exists (
    select 1 from public.order_events x
    where x.order_id = o.id and x.status = e ->> 'status'
  );

-- ---------- realtime (optional admin live feed; harmless if unused) ----------
do $$
begin
  execute 'alter publication supabase_realtime add table public.order_events';
exception when duplicate_object then null;
end $$;

-- ---------- Dispute flags + guard hardening (migration 0004) ----------
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
        || array['driver_pos_x','driver_pos_y','driver_progress',
                 'driver_lat','driver_lng'];
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
         driver_lat = null,
         driver_lng = null,
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

-- ---------- Order contacts (migration 0005) ----------

-- ---------- Store ops (migration 0007) ----------
alter table public.orders add column if not exists instructions text not null default '';
alter table public.stores add column if not exists paused_until timestamptz;
alter table public.stores add column if not exists open_hours jsonb;
-- open_hours shape: {"mon":["09:00","23:00"], ..., "sun":["10:00","22:00"]}
-- (SAST wall-clock; stores open 24h on a day use ["00:00","23:59"])

-- ---------- store-state sweep ----------
-- 1. auto-resume a timed pause when paused_until passes
-- 2. auto-pause stores outside their configured open_hours (never auto-resumes
--    a store that was paused manually — only the timer releases a pause).
--    A day with no open_hours entry = closed all day.
create or replace function public.sweep_store_state()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_swept int := 0;
  v_n int;
  v_day text := lower(to_char(now() at time zone 'Africa/Johannesburg', 'dy'));
begin
  update public.stores
     set paused = false, paused_until = null
   where paused and paused_until is not null and paused_until < now();
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  update public.stores s
     set paused = true
   where not s.paused
     and s.open_hours is not null
     and (
       -- no entry for today = closed all day
       (s.open_hours ->> v_day) is null
       or not (
         to_char(now() at time zone 'Africa/Johannesburg', 'HH24:MI')
           between (s.open_hours ->> v_day)::jsonb ->> 0
               and (s.open_hours ->> v_day)::jsonb ->> 1
       )
     );
  get diagnostics v_n = row_count; v_swept := v_swept + v_n;

  return v_swept;
end;
$$;

revoke all on function public.sweep_store_state() from public, anon, authenticated;
grant execute on function public.sweep_store_state() to postgres;

do $$
begin
  perform cron.schedule(
    'store-state-sweep',
    '* * * * *',
    'select public.sweep_store_state();'
  );
exception when others then
  raise notice 'pg_cron not available — run sweep_store_state() via a scheduled Edge Function instead. (%)', sqlerrm;
end $$;

-- ---------- Real geolocation (migration 0008) ----------
alter table public.stores    add column if not exists lat double precision;
alter table public.stores    add column if not exists lng double precision;
alter table public.customers add column if not exists lat double precision;
alter table public.customers add column if not exists lng double precision;
alter table public.drivers   add column if not exists lat double precision;
alter table public.drivers   add column if not exists lng double precision;
alter table public.orders add column if not exists store_lat    double precision;
alter table public.orders add column if not exists store_lng    double precision;
alter table public.orders add column if not exists customer_lat double precision;
alter table public.orders add column if not exists customer_lng double precision;
alter table public.orders add column if not exists driver_lat   double precision;
alter table public.orders add column if not exists driver_lng   double precision;

-- ---------- Handoff verification codes (migration 0009) ----------
-- NOT in the realtime publication; no client-facing policies — couriers can
-- only verify codes via verify_order_code, never read them.
create table if not exists public.order_codes (
  order_id     text primary key references public.orders(id) on delete cascade,
  pickup_code  char(4) not null,
  dropoff_code char(4) not null,
  created_at   timestamptz not null default now()
);
alter table public.order_codes enable row level security;
revoke all on public.order_codes from public, anon, authenticated;

create or replace function public.orders_make_codes()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.order_codes (order_id, pickup_code, dropoff_code)
  values (NEW.id, lpad(floor(random()*10000)::int::text,4,'0'), lpad(floor(random()*10000)::int::text,4,'0'))
  on conflict (order_id) do nothing;
  return NEW;
end; $$;
drop trigger if exists orders_make_codes on public.orders;
create trigger orders_make_codes after insert on public.orders
  for each row execute function public.orders_make_codes();

-- read codes: customer + store + admin of that order (never the courier)
create or replace function public.order_code(p_order_id text)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_actor uuid := auth.uid(); v_role text;
        v_order public.orders%rowtype; v_codes public.order_codes%rowtype;
begin
  if v_actor is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;
  select role into v_role from public.profiles where id = v_actor;
  if v_actor::text is distinct from v_order.customer_id
     and v_actor::text is distinct from v_order.store_id
     and v_role is distinct from 'admin' then
    return jsonb_build_object('ok',false,'reason','not_authorized');
  end if;
  select * into v_codes from public.order_codes where order_id = p_order_id;
  if not found then return jsonb_build_object('ok',false,'reason','no_codes'); end if;
  return jsonb_build_object('ok',true,'pickup_code',v_codes.pickup_code,'dropoff_code',v_codes.dropoff_code);
end; $$;
revoke all on function public.order_code(text) from public, anon;
grant execute on function public.order_code(text) to authenticated;

-- verify + transition: assigned courier only; update goes through the
-- transition guard as the driver actor
create or replace function public.verify_order_code(p_order_id text, p_code text, p_step text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := auth.uid();
        v_order public.orders%rowtype; v_expected text; v_next text;
begin
  if v_actor is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;
  if v_order.driver_id is distinct from v_actor::text then
    return jsonb_build_object('ok',false,'reason','not_courier');
  end if;
  if p_step = 'pickup' then
    if v_order.status <> 'driver_assigned' then return jsonb_build_object('ok',false,'reason','wrong_state'); end if;
    v_expected := (select pickup_code from public.order_codes where order_id = p_order_id);
    v_next := 'picked_up';
  elsif p_step = 'dropoff' then
    if v_order.status not in ('picked_up','en_route') then return jsonb_build_object('ok',false,'reason','wrong_state'); end if;
    v_expected := (select dropoff_code from public.order_codes where order_id = p_order_id);
    v_next := 'delivered';
  else
    return jsonb_build_object('ok',false,'reason','bad_step');
  end if;
  if v_expected is null or v_expected <> p_code then
    return jsonb_build_object('ok',false,'reason','wrong_code');
  end if;
  update public.orders set status = v_next where id = p_order_id returning * into v_order;
  return jsonb_build_object('ok',true,'order',to_jsonb(v_order));
end; $$;
revoke all on function public.verify_order_code(text,text,text) from public, anon;
grant execute on function public.verify_order_code(text,text,text) to authenticated;
