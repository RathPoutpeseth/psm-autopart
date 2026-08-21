-- ROLE-BASED PERMISSIONS MIGRATION
-- Run this in Supabase SQL Editor AFTER your original supabase-schema.sql.
-- Adds a "profiles" table (one row per staff member, holding their role)
-- and restricts what each role can see/do.

-- 1. Profiles table: one row per logged-in user, holding their role.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'sales' check (role in ('owner','manager','warehouse','sales')),
  created_at timestamptz default now()
);

-- 2. Auto-create a profile row whenever a new staff account is created in Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'sales');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Helper function: look up the current logged-in user's role.
create or replace function public.current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 4. Profiles RLS: everyone can see the team list; only an owner can change roles.
alter table profiles enable row level security;

create policy "anyone authenticated can view profiles" on profiles
  for select using (auth.role() = 'authenticated');

create policy "owner can update any profile" on profiles
  for update using (public.current_role() = 'owner') with check (public.current_role() = 'owner');

-- 5. Replace the old "everyone can do everything" policies with role-based ones.

drop policy if exists "staff full access" on inventory;
drop policy if exists "staff full access" on customers;
drop policy if exists "staff full access" on orders;
drop policy if exists "staff full access" on order_items;
drop policy if exists "staff full access" on staff_schedule;
drop policy if exists "staff full access" on finances;

-- Inventory: everyone can view; owner/manager/warehouse can add or edit; only owner/manager can delete.
create policy "view inventory" on inventory for select using (auth.role() = 'authenticated');
create policy "edit inventory" on inventory for insert with check (public.current_role() in ('owner','manager','warehouse'));
create policy "update inventory" on inventory for update using (public.current_role() in ('owner','manager','warehouse'));
create policy "delete inventory" on inventory for delete using (public.current_role() in ('owner','manager'));

-- Customers: everyone can view; owner/manager/sales can add or edit; only owner/manager can delete.
create policy "view customers" on customers for select using (auth.role() = 'authenticated');
create policy "add customers" on customers for insert with check (public.current_role() in ('owner','manager','sales'));
create policy "update customers" on customers for update using (public.current_role() in ('owner','manager','sales'));
create policy "delete customers" on customers for delete using (public.current_role() in ('owner','manager'));

-- Orders: everyone can view; owner/manager/sales/warehouse can create or update; only owner/manager can delete.
create policy "view orders" on orders for select using (auth.role() = 'authenticated');
create policy "add orders" on orders for insert with check (public.current_role() in ('owner','manager','sales','warehouse'));
create policy "update orders" on orders for update using (public.current_role() in ('owner','manager','sales','warehouse'));
create policy "delete orders" on orders for delete using (public.current_role() in ('owner','manager'));

create policy "view order_items" on order_items for select using (auth.role() = 'authenticated');
create policy "add order_items" on order_items for insert with check (public.current_role() in ('owner','manager','sales','warehouse'));
create policy "update order_items" on order_items for update using (public.current_role() in ('owner','manager','sales','warehouse'));
create policy "delete order_items" on order_items for delete using (public.current_role() in ('owner','manager'));

-- Staff Schedule: owner/manager only, in and out.
create policy "view staff_schedule" on staff_schedule for select using (public.current_role() in ('owner','manager'));
create policy "add staff_schedule" on staff_schedule for insert with check (public.current_role() in ('owner','manager'));
create policy "update staff_schedule" on staff_schedule for update using (public.current_role() in ('owner','manager'));
create policy "delete staff_schedule" on staff_schedule for delete using (public.current_role() in ('owner','manager'));

-- Finances: owner/manager only, in and out.
create policy "view finances" on finances for select using (public.current_role() in ('owner','manager'));
create policy "add finances" on finances for insert with check (public.current_role() in ('owner','manager'));
create policy "update finances" on finances for update using (public.current_role() in ('owner','manager'));
create policy "delete finances" on finances for delete using (public.current_role() in ('owner','manager'));

-- 6. IMPORTANT — make yourself the owner.
-- Every new user defaults to 'sales'. Run this once, replacing the email
-- with your own login email, so you have full access:
--
-- update profiles set role = 'owner' where email = 'you@yourshop.com';
