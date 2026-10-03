-- Run this in Supabase SQL Editor.
-- (The profiles.full_name column already exists from the roles migration —
-- this just adds a place to freeze the name onto each order at the time it's made,
-- so it doesn't change retroactively if someone edits their name later.)

alter table orders add column created_by_name text;
