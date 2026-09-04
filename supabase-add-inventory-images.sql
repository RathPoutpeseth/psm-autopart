-- Run this in Supabase SQL Editor.

-- 1. Add a column to inventory to store the photo's URL.
alter table inventory add column image_url text;

-- 2. You also need to create a Storage bucket for the actual photo files.
-- This can't be done from SQL — do it in the dashboard:
--
--   a. Go to Storage (left sidebar) → "New bucket"
--   b. Name it exactly: inventory-images
--   c. Toggle "Public bucket" ON (so photos can be viewed without extra setup)
--   d. Click "Create bucket"
--
-- Then come back here and run the policy below, so logged-in staff can
-- actually upload photos into that bucket (a public bucket lets anyone
-- VIEW files, but you still need a policy to allow authenticated staff
-- to ADD files).

create policy "staff can upload inventory images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'inventory-images');

create policy "staff can update inventory images"
on storage.objects for update
to authenticated
using (bucket_id = 'inventory-images');

create policy "staff can delete inventory images"
on storage.objects for delete
to authenticated
using (bucket_id = 'inventory-images');
