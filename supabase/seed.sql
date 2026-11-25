-- ========================================================================
-- FreshMart Initial Seed Data
-- ========================================================================

-- Insert Categories
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
on conflict (id) do nothing;
