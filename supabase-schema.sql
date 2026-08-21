-- Run this whole file once in Supabase: Project > SQL Editor > New query > paste > Run

create extension if not exists "pgcrypto";

create table inventory (
  id uuid primary key default gen_random_uuid(),
  part_no text not null,
  name text not null,
  brand text,
  category text,
  cost numeric default 0,
  price numeric default 0,
  qty integer default 0,
  reorder_point integer default 0,
  image_url text,
  created_at timestamptz default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  phone text,
  type text default 'Wholesale',
  address text,
  credit_limit numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  order_date date not null default current_date,
  status text default 'Open',
  created_by_email text,
  created_by_name text,
  total numeric default 0,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  part_id uuid references inventory(id) on delete set null,
  part_no text,
  name text,
  qty integer not null,
  price numeric not null,
  original_price numeric,
  discount_type text default 'fixed' check (discount_type in ('percent','fixed')),
  discount_value numeric default 0
);

create table staff_schedule (
  id uuid primary key default gen_random_uuid(),
  staff_name text not null,
  role text,
  mon text, tue text, wed text, thu text, fri text, sat text, sun text,
  created_at timestamptz default now()
);

create table finances (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  type text not null, -- 'income' or 'expense'
  category text,
  amount numeric not null,
  note text,
  customer_id uuid references customers(id) on delete set null,
  created_at timestamptz default now()
);

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
  expense_logged boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security: only logged-in staff (any authenticated user) can read/write.
-- There is no public sign-up in this app, so "authenticated" effectively means
-- "an account you personally created for a staff member" (see README).
alter table inventory enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table staff_schedule enable row level security;
alter table finances enable row level security;

create policy "staff full access" on inventory for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access" on customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access" on order_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access" on staff_schedule for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff full access" on finances for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
