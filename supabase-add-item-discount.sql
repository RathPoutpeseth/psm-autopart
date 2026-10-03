-- Run this in Supabase SQL Editor.
-- Adds per-line-item discount support to order_items.

alter table order_items add column original_price numeric;
alter table order_items add column discount_type text default 'fixed' check (discount_type in ('percent','fixed'));
alter table order_items add column discount_value numeric default 0;
