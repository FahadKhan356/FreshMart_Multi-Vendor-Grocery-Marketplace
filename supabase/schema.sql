-- ========================================================================
-- FreshMart Multi-Vendor Grocery Marketplace - Master Supabase Schema
-- ========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('customer', 'vendor', 'admin', 'courier')),
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Stores Table (Independent Grocery Vendors)
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  banner text,
  address text not null,
  phone text,
  commission_rate numeric(4,2) default 0.08 not null, -- 8% marketplace fee
  status text not null default 'approved' check (status in ('pending_review', 'approved', 'suspended', 'rejected')),
  min_order numeric(10,2) default 15.00 not null,
  delivery_fee numeric(10,2) default 2.99 not null,
  delivery_time text default '25-35 mins' not null,
  created_at timestamptz default now() not null
);

-- 3. Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  item_count int default 0 not null,
  bg_color text,
  text_color text,
  created_at timestamptz default now() not null
);

-- 4. Products Table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id text not null references public.categories(id),
  name text not null,
  slug text not null,
  description text,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  discount_badge text,
  unit text not null default 'Each',
  origin text,
  organic boolean default true not null,
  harvest_date text,
  expiry_date text,
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int default 15 not null,
  is_available boolean default true not null,
  image text not null,
  nutrition jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. Orders Table (Parent Order)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles(id),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  tip_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'processing', 'paid', 'failed', 'partially_refunded', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'paid', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled')),
  shipping_address jsonb not null,
  delivery_instructions text,
  delivery_window text,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. Vendor Orders Table (Vendor Sub-Order for multi-vendor order splitting)
create table if not exists public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  vendor_id uuid not null references public.profiles(id),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  vendor_payout_amount numeric(10,2) not null check (vendor_payout_amount >= 0),
  platform_fee_amount numeric(10,2) not null check (platform_fee_amount >= 0),
  commission_rate numeric(4,2) not null default 0.08,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'ready', 'dispatched', 'completed', 'rejected', 'cancelled')),
  courier_id uuid references public.profiles(id),
  tracking_number text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 7. Order Items Table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_order_id uuid not null references public.vendor_orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  unit text not null,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  total_price numeric(10,2) not null,
  created_at timestamptz default now() not null
);

-- 8. Refund Requests Table (Quality Guarantee Claims)
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  claim_number text not null unique,
  order_id uuid not null references public.orders(id),
  vendor_order_id uuid references public.vendor_orders(id),
  customer_id uuid not null references public.profiles(id),
  store_id uuid not null references public.stores(id),
  amount numeric(10,2) not null check (amount > 0),
  reason text not null,
  additional_details text,
  image_url text,
  status text not null default 'requested' check (status in ('requested', 'under_review', 'approved', 'rejected', 'processing', 'refunded', 'failed')),
  rejection_reason text,
  stripe_refund_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 9. Refund Items Table
create table if not exists public.refund_items (
  id uuid primary key default gen_random_uuid(),
  refund_request_id uuid not null references public.refund_requests(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id),
  quantity int not null check (quantity > 0),
  amount numeric(10,2) not null check (amount > 0)
);

-- 10. Vendor Balances Table
create table if not exists public.vendor_balances (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  available_balance numeric(12,2) default 0.00 not null,
  pending_balance numeric(12,2) default 0.00 not null,
  total_withdrawn numeric(12,2) default 0.00 not null,
  updated_at timestamptz default now() not null
);

-- 11. Vendor Payouts Table
create table if not exists public.vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  payout_number text not null unique,
  store_id uuid not null references public.stores(id) on delete cascade,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  net_payout numeric(10,2) not null,
  status text not null default 'completed' check (status in ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id text,
  bank_account_last4 text default '8821',
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now() not null
);

-- 12. Deliveries Table
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  vendor_order_id uuid not null unique references public.vendor_orders(id) on delete cascade,
  courier_id uuid not null references public.profiles(id),
  status text not null default 'in_transit' check (status in ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  pickup_address text not null,
  dropoff_address text not null,
  bag_temp_celsius numeric(4,1) default 3.4,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- 13. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean default false not null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- 14. Audit Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz default now() not null
);

-- ========================================================================
-- Row Level Security (RLS) Configuration
-- ========================================================================

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.vendor_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.refund_requests enable row level security;
alter table public.refund_items enable row level security;
alter table public.vendor_balances enable row level security;
alter table public.vendor_payouts enable row level security;
alter table public.deliveries enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Public Read Policies
create policy "Public categories are viewable by everyone" on public.categories for select using (true);
create policy "Public stores are viewable by everyone" on public.stores for select using (status = 'approved');
create policy "Public products are viewable by everyone" on public.products for select using (is_available = true);

-- Profiles Policies
create policy "Users can view their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Orders Policies
create policy "Allow select orders" on public.orders for select using (true);
create policy "Allow insert orders" on public.orders for insert with check (true);
create policy "Allow update orders" on public.orders for update using (true) with check (true);

-- Vendor Orders Policies
create policy "Allow select vendor_orders" on public.vendor_orders for select using (true);
create policy "Allow insert vendor_orders" on public.vendor_orders for insert with check (true);
create policy "Allow update vendor_orders" on public.vendor_orders for update using (true) with check (true);

-- Order Items Policies
create policy "Allow select order_items" on public.order_items for select using (true);
create policy "Allow insert order_items" on public.order_items for insert with check (true);

-- Refund Policies
create policy "Allow insert refund_requests" on public.refund_requests for insert with check (true);
create policy "Allow update refund_requests" on public.refund_requests for update using (true) with check (true);
create policy "Allow select refund_items" on public.refund_items for select using (true);
create policy "Allow insert refund_items" on public.refund_items for insert with check (true);

-- Vendor Balances Policies
create policy "Allow select vendor_balances" on public.vendor_balances for select using (true);
create policy "Allow update vendor_balances" on public.vendor_balances for update using (true) with check (true);

-- Notifications Policies
create policy "Allow select notifications" on public.notifications for select using (true);
create policy "Allow insert notifications" on public.notifications for insert with check (true);
create policy "Allow update notifications" on public.notifications for update using (true) with check (true);

-- Deliveries Policies
create policy "Allow insert deliveries" on public.deliveries for insert with check (true);
create policy "Allow update deliveries" on public.deliveries for update using (true) with check (true);
