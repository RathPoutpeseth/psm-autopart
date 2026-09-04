-- Run this in Supabase SQL Editor.
-- Lets each individual sold item (confirmed during a month-end Reconcile)
-- log its own income entry in Finances, instead of waiting for the whole
-- order to be marked "Paid".

alter table order_items add column income_logged boolean default false;
alter table order_items add column income_finance_id uuid references finances(id) on delete set null;
