-- Run this in Supabase SQL Editor.
-- Lets customers log in with a simple username instead of an email address.
-- (Supabase Auth itself still technically stores an email per account — the
-- owner sets a placeholder one when creating the login — but customers will
-- never see or need to know it. They only ever type their username.)

alter table customer_profiles add column username text unique;

-- Public lookup: given a username, return the real email behind it, so the
-- login screen can silently convert "username" -> "email" before signing in.
-- Runs even for logged-out visitors (that's the point — it's needed to log in),
-- and only ever returns an email string, nothing else.
create or replace function public.lookup_customer_email(p_username text)
returns text
language sql
security definer
stable
as $$
  select email from public.customer_profiles where username = p_username;
$$;

grant execute on function public.lookup_customer_email(text) to anon, authenticated;
