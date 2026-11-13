-- 0005_contacts.sql
-- In-app calling support: phone numbers on drivers/stores + party-scoped
-- contact lookup. Phones are NOT columns on orders — 'ready' orders broadcast
-- to the whole driver pool and would leak customer numbers to unassigned
-- drivers. The RPC returns them only to the order's parties (and admin).
-- Rollback: see bottom of file (commented block).

alter table public.drivers add column if not exists phone text not null default '';
alter table public.stores  add column if not exists phone text not null default '';

create or replace function public.order_contacts(p_order_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_order  public.orders%rowtype;
  v_actor  uuid := auth.uid();
  v_role   text;
begin
  if v_actor is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select p.role into v_role from public.profiles p where p.id = v_actor;
  if not (
    v_role = 'admin'
    or v_actor::text = v_order.customer_id
    or v_actor::text = v_order.store_id
    or v_actor::text = v_order.driver_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_a_party');
  end if;

  return jsonb_build_object(
    'ok', true,
    'customer_phone', coalesce(
      (select c.phone from public.customers c where c.id = v_order.customer_id), ''),
    'store_phone', coalesce(
      (select s.phone from public.stores s where s.id = v_order.store_id), ''),
    'driver_phone', coalesce(
      (select d.phone from public.drivers d where d.id = v_order.driver_id), ''),
    'driver_name', v_order.driver_name,
    'customer_name', v_order.customer_name,
    'store_name', v_order.store_name
  );
end;
$$;

revoke all on function public.order_contacts(text) from public, anon;
grant execute on function public.order_contacts(text) to authenticated;

/* ---------- ROLLBACK ----------
revoke all on function public.order_contacts(text) from authenticated;
drop function if exists public.order_contacts(text);
alter table public.drivers drop column if exists phone;
alter table public.stores  drop column if exists phone;
*/
