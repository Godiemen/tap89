-- 0003_order_events.sql
-- Audit trail: immutable per-status event log for every order.
-- orders.timeline stays as the denormalized cache the apps read;
-- this table is the richer record (actor, role, from-status, reason).
-- Rollback: see bottom of file (commented block).

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

/* ---------- ROLLBACK ----------
do $$
begin
  execute 'alter publication supabase_realtime drop table public.order_events';
exception when others then null;
end $$;
drop trigger if exists order_event_writer on public.orders;
drop function if exists public.order_event_writer();
drop table if exists public.order_events;
*/
