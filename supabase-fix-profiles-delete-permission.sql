-- Run this in Supabase SQL Editor.
-- This is likely the REAL reason the "leftover staff record" bug kept coming
-- back: there was never a rule allowing an Owner to delete rows from the
-- profiles table. Every automatic cleanup the app tried to do (when linking
-- a new customer account) was silently failing with no error, because the
-- database was quietly refusing the delete.

create policy "owner can delete profiles" on profiles for delete
  using (public.current_role() = 'owner');
