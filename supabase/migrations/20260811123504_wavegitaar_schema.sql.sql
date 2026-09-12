/*
# WaveGitaar Webshop Schema — Complete Rebuild

This migration creates a complete professional guitar webshop schema.

## New Tables
1. categories — Product categories
2. products — Full product catalog
3. product_images — Multiple images per product
4. customers — Customer records
5. orders — Order records with status tracking
6. order_items — Line items per order
7. payment_providers — Configurable payment providers
8. payments — Payment records
9. reviews — Product reviews
10. site_settings — Key-value store for settings
11. site_content — CMS-managed text content
12. whatsapp_settings — WhatsApp widget config
13. legal_pages — Legal page content

## Security
- RLS on all tables
- Public read on visible products, categories, approved reviews, content, settings, legal pages, whatsapp settings
- Admin (authenticated) full CRUD on all tables
- Anon can insert orders, order_items, customers, reviews, payments
*/

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_categories" ON categories;
CREATE POLICY "admin_all_categories" ON categories FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  brand text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  short_description text,
  description text,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  sku text,
  stock integer DEFAULT 0,
  weight text,
  lead_time text DEFAULT '1-3 werkdagen',
  specifications jsonb DEFAULT '{}'::jsonb,
  features text[] DEFAULT '{}',
  is_visible boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  badge text,
  meta_title text,
  meta_description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_visible_products" ON products;
CREATE POLICY "public_read_visible_products" ON products FOR SELECT
  TO anon, authenticated USING (is_visible = true);
DROP POLICY IF EXISTS "admin_all_products" ON products;
CREATE POLICY "admin_all_products" ON products FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order integer DEFAULT 0
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_product_images" ON product_images;
CREATE POLICY "admin_all_product_images" ON product_images FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  street text,
  postal_code text,
  city text,
  country text DEFAULT 'Nederland',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_customers" ON customers;
CREATE POLICY "admin_all_customers" ON customers FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_email text,
  customer_first_name text,
  customer_last_name text,
  customer_phone text,
  shipping_address jsonb,
  notes text,
  status text NOT NULL DEFAULT 'nieuw',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_provider text,
  payment_status text DEFAULT 'pending',
  payment_intent_id text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_create_orders" ON orders;
CREATE POLICY "anon_create_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_orders" ON orders;
CREATE POLICY "admin_all_orders" ON orders FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_slug text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_order_items" ON order_items;
CREATE POLICY "admin_all_order_items" ON order_items FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- PAYMENT PROVIDERS
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_enabled boolean DEFAULT false,
  is_default boolean DEFAULT false,
  mode text DEFAULT 'test',
  config jsonb DEFAULT '{}'::jsonb,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_payment_providers" ON payment_providers;
CREATE POLICY "admin_all_payment_providers" ON payment_providers FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_read_enabled_providers" ON payment_providers;
CREATE POLICY "public_read_enabled_providers" ON payment_providers FOR SELECT
  TO anon, authenticated USING (is_enabled = true);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  provider_code text NOT NULL,
  payment_method text,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  transaction_ref text,
  refund_amount numeric(10,2) DEFAULT 0,
  refund_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_payments" ON payments;
CREATE POLICY "admin_all_payments" ON payments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  is_approved boolean DEFAULT false,
  is_example boolean DEFAULT false,
  source text DEFAULT 'wavegitaar',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (is_approved = true);
DROP POLICY IF EXISTS "admin_all_reviews" ON reviews;
CREATE POLICY "admin_all_reviews" ON reviews FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_create_reviews" ON reviews;
CREATE POLICY "anon_create_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_site_settings" ON site_settings;
CREATE POLICY "admin_all_site_settings" ON site_settings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- SITE CONTENT
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text UNIQUE NOT NULL,
  title text,
  subtitle text,
  body text,
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_site_content" ON site_content;
CREATE POLICY "admin_all_site_content" ON site_content FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- WHATSAPP SETTINGS
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT true,
  employee_name text DEFAULT 'Paul',
  employee_status text DEFAULT 'Online voor vragen',
  phone_number text,
  profile_image_url text,
  welcome_message text DEFAULT 'Hallo, waarmee kunnen we je helpen?',
  show_on_desktop boolean DEFAULT true,
  show_on_mobile boolean DEFAULT true,
  button_position text DEFAULT 'bottom_right',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_whatsapp_settings" ON whatsapp_settings;
CREATE POLICY "public_read_whatsapp_settings" ON whatsapp_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_whatsapp_settings" ON whatsapp_settings;
CREATE POLICY "admin_all_whatsapp_settings" ON whatsapp_settings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- LEGAL PAGES
CREATE TABLE IF NOT EXISTS legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  body text,
  is_published boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_legal_pages" ON legal_pages;
CREATE POLICY "public_read_legal_pages" ON legal_pages FOR SELECT
  TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "admin_all_legal_pages" ON legal_pages;
CREATE POLICY "admin_all_legal_pages" ON legal_pages FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_visible);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_legal_pages_slug ON legal_pages(slug);

-- AUTO-UPDATE updated_at TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_payment_providers_updated ON payment_providers;
CREATE TRIGGER trg_payment_providers_updated BEFORE UPDATE ON payment_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_site_settings_updated ON site_settings;
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_site_content_updated ON site_content;
CREATE TRIGGER trg_site_content_updated BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_whatsapp_updated ON whatsapp_settings;
CREATE TRIGGER trg_whatsapp_updated BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_legal_pages_updated ON legal_pages;
CREATE TRIGGER trg_legal_pages_updated BEFORE UPDATE ON legal_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION decrement_stock(product_id_arg uuid, qty_arg integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - qty_arg)
  WHERE id = product_id_arg;
END;
$$;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  date_part text;
  rand_part text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  rand_part := '';
  FOR i IN 1..6 LOOP
    rand_part := rand_part || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN 'WG-' || date_part || '-' || rand_part;
END;
$$;
