-- Run this in Supabase SQL Editor.
-- Tracks whether a supplier bill has already generated a Finances expense
-- entry, so marking it Paid → Unpaid → Paid again doesn't double-count it.

alter table supplier_invoices add column expense_logged boolean default false;
