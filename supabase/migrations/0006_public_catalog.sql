-- 0006_public_catalog.sql
-- Anonymous (signed-out) read access to the public catalog. These policies
-- existed in schema.sql for fresh installs but were never packaged as a
-- migration — databases created before them show an empty storefront to
-- guests even though the customer app supports public browsing.
-- Scope is deliberately narrow: APPROVED stores, their products, ACTIVE
-- promos, and platform settings. Everything else stays authenticated-only.
-- Rollback: see bottom of file (commented block).

drop policy if exists stores_select_anon on public.stores;
create policy stores_select_anon on public.stores for select to anon
  using (approved);

drop policy if exists products_select_anon on public.products;
create policy products_select_anon on public.products for select to anon
  using (exists (select 1 from public.stores s where s.id = products.store_id and s.approved));

drop policy if exists promos_select_anon on public.promos;
create policy promos_select_anon on public.promos for select to anon
  using (active);

drop policy if exists settings_select_anon on public.settings;
create policy settings_select_anon on public.settings for select to anon
  using (true);

/* ---------- ROLLBACK ----------
drop policy if exists settings_select_anon on public.settings;
drop policy if exists promos_select_anon on public.promos;
drop policy if exists products_select_anon on public.products;
drop policy if exists stores_select_anon on public.stores;
*/
