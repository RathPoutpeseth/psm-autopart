-- Run this in Supabase SQL Editor.
-- Updates the customer-facing catalog function to also include each part's photo.

create or replace function public.storefront_catalog()
returns table(id uuid, part_no text, name text, brand text, category text, price numeric, qty integer, image_url text)
language sql security definer stable as $$
  select id, part_no, name, brand, category, price, qty, image_url from public.inventory order by part_no;
$$;
