-- Run this in Supabase SQL Editor.
-- This is the REAL fix for customers seeing everyone's balance.
--
-- Back when staff roles were first set up, a rule was created that let
-- ANY logged-in account view every order ("view orders" / "view order_items").
-- That rule was never removed when the customer portal was added later —
-- so even after cleaning up the leftover staff records, this older, broader
-- rule was still quietly letting customer logins see every order in the
-- system. This replaces it with a properly scoped version.

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
