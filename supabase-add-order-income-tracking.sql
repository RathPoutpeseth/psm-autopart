-- Run this in Supabase SQL Editor.
-- Lets a Paid order automatically log matching income in Finances,
-- and keeps that income in sync if the order is later reconciled.

alter table orders add column income_logged boolean default false;
alter table orders add column income_finance_id uuid references finances(id) on delete set null;
