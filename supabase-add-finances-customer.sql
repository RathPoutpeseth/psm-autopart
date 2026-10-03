-- Run this in Supabase SQL Editor.

alter table finances add column customer_id uuid references customers(id) on delete set null;
