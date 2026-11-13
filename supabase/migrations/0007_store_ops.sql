-- 0007_store_ops.sql
-- Merchant ops: timed pause + opening hours + per-order instructions.
-- Requires pg_cron (same as 0002). Rollback: see bottom of file.

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

/* ---------- ROLLBACK ----------
do $$ begin perform cron.unschedule('store-state-sweep'); exception when others then null; end $$;
drop function if exists public.sweep_store_state();
alter table public.stores drop column if exists paused_until,
                           drop column if exists open_hours;
alter table public.orders drop column if exists instructions;
*/
