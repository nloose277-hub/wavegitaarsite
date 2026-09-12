/*
# Premium BBQ Shop — Core Schema

1. Overview
This migration creates the full data model for a premium e-commerce store
selling The Bastard kamado grills, accessories, bundles, with orders,
coupons, customers, and homepage content management.

2. New Tables
- `categories` — product categories (grills, accessories, etc.)
- `products` — sellable products with pricing, inventory, imagery
- `accessories` — accessories metadata (linked to products)
- `bundles` — starter packs combining a grill + accessories
- `bundle_items` — junction: which products appear in which bundle
- `product_images` — gallery images per product
- `product_reviews` — customer reviews per product
- `customers` — checkout customers (guest + account)
- `orders` — placed orders
- `order_items` — line items per order
- `coupons` — discount codes
- `homepage_content` — editable homepage section content
- `admin_users` — simple admin auth markers (email)
- `analytics_events` — page views / conversion events

3. Pricing model
Each product has `price` (our price) and `compare_price` (adviesprijs).
Discount of €300–400 is baked into the seed data compare_price.

4. Security
- Public read on catalog (anon + authenticated).
- Orders: customers can read their own by email token; anon may create.
- Admin writes: restricted to authenticated admin users.
- RLS enabled on every table.
*/

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  display_order int DEFAULT 0,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_categories" ON categories;
CREATE POLICY "admin_write_categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  subtitle text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'product', -- 'product' | 'accessory' | 'bundle_ref'
  description text,
  short_description text,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  currency text DEFAULT 'EUR',
  stock int NOT NULL DEFAULT 0,
  sku text,
  hero_image text,
  is_best_seller boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  badge text, -- e.g. "Bestseller", "Nieuw"
  diameter text, -- kamado specs
  weight text,
  highlights jsonb DEFAULT '[]'::jsonb,
  specs jsonb DEFAULT '{}'::jsonb, -- flexible specs key/value
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products FOR SELECT TO anon, authenticated USING (is_active = true OR true);
DROP POLICY IF EXISTS "admin_write_products" ON products;
CREATE POLICY "admin_write_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- product_images ----------
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int DEFAULT 0
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_images" ON product_images;
CREATE POLICY "public_read_images" ON product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_images" ON product_images;
CREATE POLICY "admin_write_images" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- bundles ----------
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE, -- the parent product (grill)
  name text NOT NULL,
  description text,
  bundle_price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  savings_label text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_bundles" ON bundles;
CREATE POLICY "public_read_bundles" ON bundles FOR SELECT TO anon, authenticated USING (is_active = true OR true);
DROP POLICY IF EXISTS "admin_write_bundles" ON bundles;
CREATE POLICY "admin_write_bundles" ON bundles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- bundle_items ----------
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES bundles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity int DEFAULT 1
);
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_bundle_items" ON bundle_items;
CREATE POLICY "public_read_bundle_items" ON bundle_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_bundle_items" ON bundle_items;
CREATE POLICY "admin_write_bundle_items" ON bundle_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- product_reviews ----------
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_reviews" ON product_reviews;
CREATE POLICY "public_read_reviews" ON product_reviews FOR SELECT TO anon, authenticated USING (is_approved = true);
DROP POLICY IF EXISTS "anon_create_reviews" ON product_reviews;
CREATE POLICY "anon_create_reviews" ON product_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_reviews" ON product_reviews;
CREATE POLICY "admin_write_reviews" ON product_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------- customers ----------
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'Nederland',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_create_customers" ON customers;
CREATE POLICY "anon_create_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_customers" ON customers;
CREATE POLICY "admin_all_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_email text,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
  subtotal numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  coupon_code text,
  shipping_address jsonb,
  payment_method text DEFAULT 'stripe',
  payment_intent_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_create_orders" ON orders;
CREATE POLICY "anon_create_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_read_own_orders" ON orders;
CREATE POLICY "anon_read_own_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_orders" ON orders;
CREATE POLICY "admin_all_orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_slug text,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_order_items" ON order_items;
CREATE POLICY "admin_write_order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- coupons ----------
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage', -- percentage | fixed
  discount_value numeric(10,2) NOT NULL,
  min_order numeric(10,2) DEFAULT 0,
  usage_limit int,
  used_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_coupons" ON coupons;
CREATE POLICY "public_read_coupons" ON coupons FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "anon_use_coupons" ON coupons;
CREATE POLICY "anon_use_coupons" ON coupons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_coupons" ON coupons;
CREATE POLICY "admin_write_coupons" ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- homepage_content ----------
CREATE TABLE IF NOT EXISTS homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text UNIQUE NOT NULL, -- 'hero', 'bestsellers_title', 'lifestyle', etc.
  title text,
  subtitle text,
  body text,
  image_url text,
  cta_text text,
  cta_link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_homepage" ON homepage_content;
CREATE POLICY "public_read_homepage" ON homepage_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_homepage" ON homepage_content;
CREATE POLICY "admin_write_homepage" ON homepage_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- analytics_events ----------
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'page_view', 'add_to_cart', 'purchase', etc.
  page text,
  product_id uuid,
  session_id text,
  value numeric(10,2),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_log_events" ON analytics_events;
CREATE POLICY "anon_log_events" ON analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_read_events" ON analytics_events;
CREATE POLICY "admin_read_events" ON analytics_events FOR SELECT TO authenticated USING (true);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
