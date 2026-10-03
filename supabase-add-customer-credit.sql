-- Run this in Supabase SQL Editor.

alter table customers add column credit_limit numeric default 0;

-- Note: "balance due" is NOT stored as a column — it's calculated live by the
-- app as the sum of that customer's order totals where status isn't 'Paid'.
-- That way it's always accurate and never goes stale.
