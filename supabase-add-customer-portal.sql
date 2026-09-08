-- CUSTOMER PORTAL MIGRATION (fixed version)
-- Run this in Supabase SQL Editor.
-- Adds a second login type: customers can log in, see a safe (no-cost)
-- catalog with their prices, and submit their own orders.

-- 1. Link table: which login (auth user) belongs to which customer record.
create table customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  email text,
  username text unique,
  created_at timestamptz default now()
);
alter table customer_profiles enable row level security;

-- 2. Helper: is the current login a staff member?
create or replace function public.is_staff()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid());
$$;

-- 3. Helper: which customer_id does the current login belong to (if a customer)?
create or replace function public.my_customer_id()
returns uuid language sql security definer stable as $$
  select customer_id from public.customer_profiles where id = auth.uid();
$$;

-- 4. Now that the helper functions exist, add the RLS policies for customer_profiles.
create policy "staff manage customer_profiles" on customer_profiles for all
  using (public.is_staff()) with check (public.is_staff());
create policy "customer view own profile" on customer_profiles for select
  using (id = auth.uid());

-- 5. Safe catalog for customer logins — no cost column, ever.
create or replace function public.storefront_catalog()
returns table(id uuid, part_no text, name text, brand text, category text, price numeric, qty integer, image_url text)
language sql security definer stable as $$
  select id, part_no, name, brand, category, price, qty, image_url from public.inventory order by part_no;
$$;
grant execute on function public.storefront_catalog() to authenticated;

-- 5b. Public lookup for username-based customer login (see step 10 below).
create or replace function public.lookup_customer_email(p_username text)
returns text language sql security definer stable as $$
  select email from public.customer_profiles where username = p_username;
$$;
grant execute on function public.lookup_customer_email(text) to anon, authenticated;

-- 6. Lock the RAW inventory table (which includes cost) to staff only.
--    Customers must go through storefront_catalog() above instead.
drop policy if exists "view inventory" on inventory;
drop policy if exists "staff view inventory" on inventory;
create policy "staff view inventory" on inventory for select using (public.is_staff());

-- 7. Customers table: staff see everyone; a customer login sees only their own record.
drop policy if exists "view customers" on customers;
create policy "view customers" on customers for select
  using (public.is_staff() or id = public.my_customer_id());

-- 8. Orders/order_items: staff already have full access from earlier migrations,
--    but the ORIGINAL "view orders"/"view order_items" policies (created back
--    when roles were first set up) were too broad — they let ANY logged-in
--    account view every order. Replace them with a properly scoped version.
drop policy if exists "view orders" on orders;
create policy "view orders" on orders for select
  using (public.is_staff() or customer_id = public.my_customer_id());

drop policy if exists "view order_items" on order_items;
create policy "view order_items" on order_items for select
  using (
    public.is_staff() or exists (
      select 1 from orders o where o.id = order_items.order_id and o.customer_id = public.my_customer_id()
    )
  );

-- 9. Function that safely places an order on the customer's behalf:
--    creates the order, its line items, AND deducts stock — all atomically,
--    using the price list from inventory (never a client-supplied price).
create or replace function public.place_customer_order(items jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  new_order_id uuid;
  my_cust_id uuid;
  computed_total numeric := 0;
  item jsonb;
  real_price numeric;
  real_part_no text;
  real_name text;
begin
  my_cust_id := public.my_customer_id();
  if my_cust_id is null then
    raise exception 'This login is not linked to a customer account.';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    select price, part_no, name into real_price, real_part_no, real_name
    from public.inventory where id = (item->>'part_id')::uuid;

    if real_price is null then
      raise exception 'Part not found.';
    end if;

    computed_total := computed_total + (real_price * (item->>'qty')::numeric);
  end loop;

  insert into public.orders (customer_id, order_date, status, total)
  values (my_cust_id, current_date, 'Open', computed_total)
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(items)
  loop
    select price, part_no, name into real_price, real_part_no, real_name
    from public.inventory where id = (item->>'part_id')::uuid;

    insert into public.order_items (order_id, part_id, part_no, name, qty, price, original_price, discount_type, discount_value)
    values (new_order_id, (item->>'part_id')::uuid, real_part_no, real_name, (item->>'qty')::integer, real_price, real_price, 'fixed', 0);

    update public.inventory set qty = greatest(0, qty - (item->>'qty')::integer)
    where id = (item->>'part_id')::uuid;
  end loop;

  return new_order_id;
end;
$$;

grant execute on function public.place_customer_order(jsonb) to authenticated;

-- 10. IMPORTANT — how to actually give a customer a login (see README section
-- "Customer Portal Setup" for the full walkthrough). Short version:
--   a. Authentication → Users → Add user (any made-up email is fine, e.g.
--      chanthorn@kzmall.local — the customer never sees it)
--   b. Copy that user's UUID from the Users list
--   c. In the app, go to the (owner-only) "Customer Access" tab
--   d. Paste the UUID, pick which customer record it belongs to, type the
--      SAME email as step (a), and set a Username — that's what they'll
--      actually type to log in. Save.
