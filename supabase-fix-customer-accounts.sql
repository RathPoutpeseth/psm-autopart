-- Run this ONCE in Supabase SQL Editor.
-- Fixes every customer login you've already set up, in one shot — removing
-- the leftover "staff" record that was accidentally letting them see
-- everyone's data instead of just their own.
--
-- Safe to run even if some (or all) of these were already fixed manually —
-- it simply does nothing for accounts that don't have the problem.

delete from profiles
where id in (select id from customer_profiles);

-- After running this, ask each customer to sign out and sign back in
-- (the fix only takes effect on their next login, not their current session).
