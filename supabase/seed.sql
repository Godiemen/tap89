-- SipDash seed — run after schema.sql in the Supabase SQL editor
-- Clears all tables (profiles too — delete orphaned users in Dashboard →
-- Authentication → Users if you want a full reset) and loads only the
-- platform settings the apps expect. Everything else starts empty:
-- users create their own accounts from each app's sign-up screen.

truncate public.orders, public.trips, public.settings, public.promos, public.customers, public.drivers, public.products, public.stores, public.profiles cascade;

insert into public.settings values ('surge', '1'::jsonb);
insert into public.settings values ('platform_fee_pct', '22'::jsonb);
insert into public.settings values ('accept_timeout_sec', '90'::jsonb);
insert into public.settings values ('prep_timeout_sec', '2700'::jsonb);
insert into public.settings values ('courier_timeout_sec', '900'::jsonb);
insert into public.settings values ('pickup_timeout_sec', '1800'::jsonb);
insert into public.settings values ('delivery_timeout_sec', '7200'::jsonb);
