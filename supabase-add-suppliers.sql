-- Run this in Supabase SQL Editor.
-- Adds Suppliers + Supplier Invoices (accounts payable / what you owe suppliers).

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete set null,
  invoice_number text,
  invoice_date date not null default current_date,
  amount numeric not null default 0,
  status text not null default 'Unpaid' check (status in ('Unpaid','Paid')),
  file_url text,
  note text,
  created_at timestamptz default now()
);

alter table suppliers enable row level security;
alter table supplier_invoices enable row level security;

-- Same restriction level as Finances: only Owner/Manager can see or touch this
-- (this is your accounts-payable / money-you-owe data, not for every staff role).
create policy "owner/manager view suppliers" on suppliers for select using (public.current_role() in ('owner','manager'));
create policy "owner/manager add suppliers" on suppliers for insert with check (public.current_role() in ('owner','manager'));
create policy "owner/manager update suppliers" on suppliers for update using (public.current_role() in ('owner','manager'));
create policy "owner/manager delete suppliers" on suppliers for delete using (public.current_role() in ('owner','manager'));

create policy "owner/manager view supplier_invoices" on supplier_invoices for select using (public.current_role() in ('owner','manager'));
create policy "owner/manager add supplier_invoices" on supplier_invoices for insert with check (public.current_role() in ('owner','manager'));
create policy "owner/manager update supplier_invoices" on supplier_invoices for update using (public.current_role() in ('owner','manager'));
create policy "owner/manager delete supplier_invoices" on supplier_invoices for delete using (public.current_role() in ('owner','manager'));

-- You also need a Storage bucket for the uploaded invoice files/photos.
-- This can't be done from SQL — do it in the dashboard:
--
--   a. Go to Storage (left sidebar) → "New bucket"
--   b. Name it exactly: supplier-invoices
--   c. Leave "Public bucket" OFF (these are financial documents — keep them private)
--   d. Optionally set a file size limit (e.g. 10 MB) and allowed types:
--      image/jpeg,image/png,image/webp,application/pdf
--   e. Click "Create bucket"
--
-- Then run the policies below so only Owner/Manager can upload or view these files.

create policy "owner/manager upload supplier invoices"
on storage.objects for insert
to authenticated
with check (bucket_id = 'supplier-invoices' and public.current_role() in ('owner','manager'));

create policy "owner/manager view supplier invoices"
on storage.objects for select
to authenticated
using (bucket_id = 'supplier-invoices' and public.current_role() in ('owner','manager'));

create policy "owner/manager delete supplier invoices"
on storage.objects for delete
to authenticated
using (bucket_id = 'supplier-invoices' and public.current_role() in ('owner','manager'));
