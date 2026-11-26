-- ========================================================================
-- FreshMart Initial Seed Data
-- ========================================================================

-- Grant schema permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

-- 1. Insert Categories
insert into public.categories (id, name, slug, icon, item_count, bg_color, text_color) values
  ('fruits-veggies', 'Fruits & Vegetables', 'fruits-vegetables', 'Salad', 320, 'bg-emerald-50', 'text-emerald-700'),
  ('dairy-eggs', 'Dairy & Eggs', 'dairy-eggs', 'Milk', 185, 'bg-amber-50', 'text-amber-700'),
  ('meat-seafood', 'Meat & Seafood', 'meat-seafood', 'Fish', 140, 'bg-rose-50', 'text-rose-700'),
  ('bakery', 'Artisan Bakery', 'bakery', 'Croissant', 95, 'bg-orange-50', 'text-orange-700'),
  ('beverages', 'Beverages', 'beverages', 'Coffee', 210, 'bg-cyan-50', 'text-cyan-700'),
  ('snacks', 'Healthy Snacks', 'snacks', 'Cookie', 160, 'bg-yellow-50', 'text-yellow-700'),
  ('household', 'Household Essentials', 'household-essentials', 'Sparkles', 280, 'bg-indigo-50', 'text-indigo-700'),
  ('frozen', 'Frozen Foods', 'frozen-foods', 'Snowflake', 115, 'bg-sky-50', 'text-sky-700'),
  ('personal-care', 'Personal Care', 'personal-care', 'Heart', 130, 'bg-pink-50', 'text-pink-700')
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  item_count = excluded.item_count;

-- 2. Insert Seed Users in auth.users
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer@freshmart.local', crypt('FreshMart2026!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Sarah Jenkins"}', now(), now()),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vendor1@freshmart.local', crypt('FreshMart2026!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Valley Green Grocers"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vendor2@freshmart.local', crypt('FreshMart2026!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Sunrise Dairy"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@freshmart.local', crypt('FreshMart2026!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Super Admin"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'courier@freshmart.local', crypt('FreshMart2026!', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Marcus Vance"}', now(), now())
on conflict (id) do nothing;

-- 3. Insert Profiles
insert into public.profiles (id, role, full_name, email, phone, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000001', 'customer', 'Sarah Jenkins', 'customer@freshmart.local', '(555) 234-8901', now(), now()),
  ('11111111-1111-1111-1111-111111111111', 'vendor', 'Valley Green Grocers', 'vendor1@freshmart.local', '(555) 441-9920', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'vendor', 'Sunrise Dairy & Organic', 'vendor2@freshmart.local', '(555) 312-8840', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'admin', 'Super Admin', 'admin@freshmart.local', '(555) 100-0001', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'courier', 'Marcus Vance (Courier)', 'courier@freshmart.local', '(555) 782-3490', now(), now())
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role;

-- 4. Insert Stores
insert into public.stores (id, vendor_id, name, slug, description, logo, banner, address, phone, commission_rate, status, min_order, delivery_fee, delivery_time) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Valley Green Grocers', 'valley-green-grocers', 'Fresh certified organic fruits, greens, and crisp roots harvested daily from Hudson Valley soils.', '🥬', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80', '142 Orchard Way, Hudson Valley, NY', '(555) 441-9920', 0.08, 'approved', 15.00, 2.99, '25-35 mins'),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Sunrise Dairy & Organic', 'sunrise-dairy-organic', '100% pasture-raised A2 whole milk, heritage butter, curd, artisanal cheeses, and farm eggs.', '🥛', 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=1200&q=80', '88 Meadow Lane, Dutchess County, NY', '(555) 312-8840', 0.08, 'approved', 12.00, 2.99, '20-30 mins'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Golden Harvest Market', 'golden-harvest-market', 'Naturally leavened sourdough bread, heritage grains, organic cold-pressed pantry essentials.', '🌾', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80', '52 Mill St, Rhinebeck, NY', '(555) 890-1234', 0.08, 'approved', 10.00, 2.99, '30-40 mins')
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status;

-- 5. Insert Vendor Balances
insert into public.vendor_balances (store_id, available_balance, pending_balance, total_withdrawn) values
  ('a1111111-1111-1111-1111-111111111111', 2840.50, 480.20, 14200.00),
  ('a2222222-2222-2222-2222-222222222222', 1940.00, 310.00, 9850.00),
  ('a3333333-3333-3333-3333-333333333333', 1420.75, 190.50, 7620.00)
on conflict (store_id) do update set
  available_balance = excluded.available_balance;

-- 6. Insert Sample Products
insert into public.products (id, store_id, category_id, name, slug, description, price, original_price, discount_badge, unit, origin, organic, stock, low_stock_threshold, is_available, image) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'fruits-veggies', 'Organic Honeycrisp Apples', 'organic-honeycrisp-apples', 'Crisp, sweet, juicy organic apples picked straight from family orchards.', 4.99, 5.99, '-17% OFF', '1 lb bag', 'Hudson Valley, NY', true, 65, 15, true, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'dairy-eggs', 'Pasture Whole Milk (A2)', 'pasture-whole-milk-a2', '100% grass-fed whole milk from heritage pasture-raised cows.', 5.49, 6.25, null, '1 Gallon', 'Dutchess County, NY', true, 42, 10, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'),
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'bakery', 'Artisan Sourdough Loaf', 'artisan-sourdough-loaf', 'Slow-fermented wild yeast sourdough with crunchy crust and open crumb.', 6.25, 7.00, null, 'Fresh Loaf', 'Rhinebeck, NY', false, 28, 8, true, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80'),
  ('b4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'fruits-veggies', 'Organic Hass Avocados', 'organic-hass-avocados', 'Creamy, rich, nutrient-dense organic Hass avocados harvested at peak ripeness.', 4.49, 5.49, '-18% OFF', '4-pack', 'California, USA', true, 55, 12, true, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80'),
  ('b5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 'dairy-eggs', 'Grade A Pasture-Raised Eggs', 'grade-a-pasture-raised-eggs', 'Rich golden yolks from hens free to roam on fresh green pastures daily.', 5.99, 6.99, null, '12-ct carton', 'Hudson Valley, NY', true, 78, 20, true, 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80')
on conflict (id) do update set
  price = excluded.price,
  stock = excluded.stock;
