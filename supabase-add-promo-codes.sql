-- Run this in Supabase SQL Editor.
-- Adds owner-created promo codes that customers can redeem in their cart.

create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric not null default 0,
  max_uses integer, -- null = unlimited
  used_count integer not null default 0,
  expires_at date, -- null = never expires
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table promo_codes enable row level security;

-- Only Owner/Manager can see or manage the codes directly.
create policy "staff manage promo codes" on promo_codes for all
  using (public.current_role() in ('owner','manager'))
  with check (public.current_role() in ('owner','manager'));

-- Customers never query this table directly — they go through this function,
-- which only ever reveals whether a code is valid and what discount it gives,
-- never the full list of codes or other customers' usage.
create or replace function public.preview_promo_code(p_code text, p_subtotal numeric)
returns table(valid boolean, discount_amount numeric, message text)
language plpgsql security definer as $$
declare
  promo record;
begin
  select * into promo from promo_codes where code = upper(trim(p_code));
  if promo is null then
    return query select false, 0::numeric, 'That code doesn''t exist.';
    return;
  end if;
  if not promo.active then
    return query select false, 0::numeric, 'That code is no longer active.';
    return;
  end if;
  if promo.expires_at is not null and promo.expires_at < current_date then
    return query select false, 0::numeric, 'That code has expired.';
    return;
  end if;
  if promo.max_uses is not null and promo.used_count >= promo.max_uses then
    return query select false, 0::numeric, 'That code has already been fully used.';
    return;
  end if;

  return query select true,
    case when promo.discount_type = 'percent'
      then round(p_subtotal * promo.discount_value / 100, 2)
      else least(promo.discount_value, p_subtotal)
    end,
    'Code applied!';
end;
$$;
grant execute on function public.preview_promo_code(text, numeric) to authenticated;

-- Extend order placement to accept and safely redeem a promo code.
-- (Re-validates everything server-side — never trusts a client-supplied discount.)
alter table orders add column promo_code text;
alter table orders add column promo_discount numeric default 0;

create or replace function public.place_customer_order(items jsonb, p_promo_code text default null)
returns uuid
language plpgsql
security definer
as $$
declare
  new_order_id uuid;
  my_cust_id uuid;
  subtotal numeric := 0;
  discount numeric := 0;
  computed_total numeric := 0;
  item jsonb;
  real_price numeric;
  real_part_no text;
  real_name text;
  promo record;
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
    subtotal := subtotal + (real_price * (item->>'qty')::numeric);
  end loop;

  if p_promo_code is not null and trim(p_promo_code) <> '' then
    select * into promo from promo_codes where code = upper(trim(p_promo_code));
    if promo is not null and promo.active
       and (promo.expires_at is null or promo.expires_at >= current_date)
       and (promo.max_uses is null or promo.used_count < promo.max_uses) then
      discount := case when promo.discount_type = 'percent'
        then round(subtotal * promo.discount_value / 100, 2)
        else least(promo.discount_value, subtotal)
      end;
      update promo_codes set used_count = used_count + 1 where id = promo.id;
    end if;
  end if;

  computed_total := greatest(0, subtotal - discount);

  insert into public.orders (customer_id, order_date, status, total, promo_code, promo_discount)
  values (my_cust_id, current_date, 'Open', computed_total, nullif(upper(trim(p_promo_code)), ''), discount)
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

grant execute on function public.place_customer_order(jsonb, text) to authenticated;
