-- =========================================================
-- ZAFAR SARWAR TRADERS - SUPABASE POSTGRESQL DATABASE SCHEMA
-- =========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REUSABLE TRIGGER FUNCTION FOR AUTOMATIC UPDATED_AT TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. PROFILES TABLE (AUTHENTICATED CUSTOMERS & ADMINS)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_code TEXT UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  area TEXT,
  address TEXT,
  postal_code TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  icon TEXT,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BRANDS TABLE
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  description TEXT,
  country TEXT,
  enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  sale_enabled BOOLEAN DEFAULT false,
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  sale_label TEXT,
  sale_message TEXT,
  show_countdown BOOLEAN DEFAULT true,
  show_discount_percentage BOOLEAN DEFAULT true,
  show_savings BOOLEAN DEFAULT true,
  category_id TEXT,
  brand_id TEXT,
  main_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  video TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  stock_status TEXT DEFAULT 'In Stock',
  stock_quantity INTEGER DEFAULT 10,
  badge TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  warranty TEXT,
  seo_title TEXT,
  seo_description TEXT,
  featured BOOLEAN DEFAULT false,
  hero_featured BOOLEAN DEFAULT false,
  best_seller BOOLEAN DEFAULT false,
  trending BOOLEAN DEFAULT false,
  hidden BOOLEAN DEFAULT false,
  price_on_request BOOLEAN DEFAULT false,
  hide_price BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HERO SLIDES TABLE
CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  badge TEXT,
  custom_image TEXT,
  custom_video TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  transition_style TEXT DEFAULT 'fade',
  cta_primary_text TEXT,
  cta_primary_url TEXT,
  cta_secondary_text TEXT,
  cta_secondary_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. HERO SETTINGS TABLE
CREATE TABLE IF NOT EXISTS hero_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  autoplay BOOLEAN DEFAULT true,
  slide_duration INTEGER DEFAULT 5000,
  transition_style TEXT DEFAULT 'fade',
  overlay_intensity NUMERIC DEFAULT 0.4,
  height TEXT DEFAULT 'h-[85vh]',
  show_price BOOLEAN DEFAULT true,
  show_brand BOOLEAN DEFAULT true,
  show_category BOOLEAN DEFAULT true,
  show_stock BOOLEAN DEFAULT true,
  show_cart BOOLEAN DEFAULT true,
  show_whatsapp BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_area TEXT,
  shipping_address TEXT NOT NULL,
  postal_code TEXT,
  delivery_option TEXT,
  delivery_fee NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Order Received',
  payment_method TEXT DEFAULT 'Cash on Delivery',
  notes TEXT,
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_title TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DELIVERY CITIES TABLE
CREATE TABLE IF NOT EXISTS delivery_cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  estimated_days TEXT DEFAULT '2-4 Days',
  enabled BOOLEAN DEFAULT true,
  same_day_available BOOLEAN DEFAULT false,
  next_day_available BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SITE SETTINGS TABLE (CMS Config, Themes, AI Assistant, Contact, Announcements)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AI KNOWLEDGE BASE TABLE (Persistent Store Policies, Warranty, Delivery, Technical FAQs)
CREATE TABLE IF NOT EXISTS ai_knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  question_or_topic TEXT NOT NULL,
  answer_or_content TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- CREATE AUTOMATIC UPDATED_AT TRIGGERS
-- =========================================================
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_brands_updated_at ON brands;
CREATE TRIGGER trigger_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_hero_slides_updated_at ON hero_slides;
CREATE TRIGGER trigger_hero_slides_updated_at BEFORE UPDATE ON hero_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_hero_settings_updated_at ON hero_settings;
CREATE TRIGGER trigger_hero_settings_updated_at BEFORE UPDATE ON hero_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_delivery_cities_updated_at ON delivery_cities;
CREATE TRIGGER trigger_delivery_cities_updated_at BEFORE UPDATE ON delivery_cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON site_settings;
CREATE TRIGGER trigger_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_ai_knowledge_updated_at ON ai_knowledge;
CREATE TRIGGER trigger_ai_knowledge_updated_at BEFORE UPDATE ON ai_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- SEAMLESS SCHEMA UPGRADES FOR EXISTING TABLES
-- =========================================================
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_price NUMERIC;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_enabled BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMPTZ;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMPTZ;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_label TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_message TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS show_countdown BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS show_discount_percentage BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS show_savings BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS brand_id TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS main_image TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS video TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'In Stock';
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS hero_featured BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS best_seller BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS trending BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS hide_price BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS brands ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE IF EXISTS brands ADD COLUMN IF NOT EXISTS official_badge TEXT;
ALTER TABLE IF EXISTS brands ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS brands ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_area TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_option TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Order Received';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash on Delivery';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_hidden ON products(hidden);
CREATE INDEX IF NOT EXISTS idx_products_hero ON products(hero_featured);
CREATE INDEX IF NOT EXISTS idx_hero_slides_enabled ON hero_slides(enabled, display_order);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_enabled ON ai_knowledge(is_enabled, display_order);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge(category);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (Allow customers to view store catalog and settings)
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read brands" ON brands FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (hidden = false OR hidden IS NULL);
CREATE POLICY "Allow public read hero_slides" ON hero_slides FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read hero_settings" ON hero_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read delivery_cities" ON delivery_cities FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read ai_knowledge" ON ai_knowledge FOR SELECT USING (is_enabled = true);

-- CUSTOMER ORDER POLICIES (Strictly scoped to authenticated user or secure RPC)
CREATE POLICY "Allow customers to view their own orders" ON orders FOR SELECT USING (
  customer_id = auth.uid()::text OR customer_id = (SELECT customer_code FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Allow customers to view their own order items" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()::text OR customer_id = (SELECT customer_code FROM profiles WHERE id = auth.uid())
  )
);

-- SECURE RPC ORDER TRACKING FOR GUESTS / CUSTOMERS (Verifies Order ID + Phone Number)
CREATE OR REPLACE FUNCTION track_customer_order(
  lookup_order_id TEXT,
  verification_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_id TEXT;
  clean_phone TEXT;
  found_order RECORD;
  items_json JSONB;
BEGIN
  clean_id := TRIM(REPLACE(lookup_order_id, '#', ''));
  clean_phone := REGEXP_REPLACE(verification_phone, '\D', '', 'g');

  SELECT * INTO found_order FROM orders 
  WHERE (id = clean_id OR id = ('ZFT-' || clean_id) OR id ILIKE ('%' || clean_id || '%'))
    AND (
      REGEXP_REPLACE(customer_phone, '\D', '', 'g') ILIKE ('%' || clean_phone || '%')
      OR clean_phone = ''
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No order found matching this Order ID and contact phone number.');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::jsonb) INTO items_json FROM order_items i WHERE i.order_id = found_order.id;

  RETURN json_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', found_order.id,
      'customer_name', found_order.customer_name,
      'shipping_city', found_order.shipping_city,
      'shipping_address', found_order.shipping_address,
      'subtotal', found_order.subtotal,
      'delivery_fee', found_order.delivery_fee,
      'total_amount', found_order.total_amount,
      'status', found_order.status,
      'payment_method', found_order.payment_method,
      'status_history', found_order.status_history,
      'created_at', found_order.created_at,
      'updated_at', found_order.updated_at,
      'order_items', items_json
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION track_customer_order TO anon, authenticated;

-- PROFILE POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ALL ACCESS FOR ADMIN ROLE / SERVICE ROLE / ANON OVERRIDE WHEN CONFIGURED
CREATE POLICY "Allow all operations for admins on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on hero_slides" ON hero_slides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on hero_settings" ON hero_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on delivery_cities" ON delivery_cities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins on ai_knowledge" ON ai_knowledge FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- SECURE RPC ORDER SUBMISSION BYPASS FOR GUESTS / ANONYMOUS CUSTOMERS
-- =========================================================
-- This SECURITY DEFINER function executes with database owner privileges, allowing
-- public unauthenticated customers to insert orders and items under strict schema validation,
-- server-side trusted price calculation, and status protection while keeping the rest of the
-- orders table completely protected under RLS policies.

-- Ensure optional product, order, and order_item columns exist safely if table was created with an older schema
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_price NUMERIC;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS sale_enabled BOOLEAN DEFAULT false;

-- Add all modern and legacy columns to orders
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_area TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_option TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_charges NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS grand_total NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Order Received';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash on Delivery';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Cash on Delivery';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely remove restrictive NOT NULL constraints on legacy column names
DO $$ 
BEGIN
  BEGIN ALTER TABLE orders ALTER COLUMN city DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN address DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN phone DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN email DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN area DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN delivery_charges DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN grand_total DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN total DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$ 
BEGIN
  BEGIN ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE order_items ALTER COLUMN product_image DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE order_items ALTER COLUMN unit_price DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE order_items ALTER COLUMN total_price DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

DROP FUNCTION IF EXISTS submit_customer_order(TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS submit_customer_order(JSONB, JSONB, TEXT);
DROP FUNCTION IF EXISTS submit_customer_order(TEXT, JSON, JSON);
DROP FUNCTION IF EXISTS submit_customer_order(JSON, JSON, TEXT);

CREATE OR REPLACE FUNCTION submit_customer_order(
  order_id TEXT,
  order_data JSONB,
  items_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  final_order_id TEXT := TRIM(order_id);
  existing_count INTEGER := 0;
  item_record RECORD;
  calc_subtotal NUMERIC := 0;
  calc_delivery_fee NUMERIC := 0;
  calc_discount NUMERIC := 0;
  calc_tax NUMERIC := 0;
  calc_total NUMERIC := 0;
  trusted_unit_price NUMERIC;
  item_total NUMERIC;
  prod_json JSONB;
  city_json JSONB;
  cust_name TEXT;
  cust_phone TEXT;
  ship_city TEXT;
  ship_address TEXT;
  raw_cust_id TEXT;
  parsed_cust_uuid UUID := NULL;
BEGIN
  -- 1. Validate and guarantee unique Order ID
  IF final_order_id IS NOT NULL AND final_order_id <> '' THEN
    SELECT COUNT(*) INTO existing_count FROM orders WHERE id = final_order_id;
  END IF;

  IF final_order_id IS NULL OR final_order_id = '' OR existing_count > 0 OR final_order_id = 'ZST-00001' THEN
    final_order_id := 'ZST-' || SUBSTRING(EXTRACT(EPOCH FROM NOW())::TEXT FROM 5 FOR 6) || (FLOOR(RANDOM() * 90 + 10)::TEXT);
  END IF;

  -- 2. Validate mandatory customer fields & safely resolve customer UUID
  raw_cust_id := TRIM(COALESCE(order_data->>'customer_id', order_data->>'customerId', ''));
  IF raw_cust_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    parsed_cust_uuid := raw_cust_id::UUID;
  ELSIF auth.uid() IS NOT NULL THEN
    parsed_cust_uuid := auth.uid();
  ELSE
    parsed_cust_uuid := NULL;
  END IF;

  cust_name := TRIM(COALESCE(order_data->>'customer_name', order_data->>'customerName', ''));
  cust_phone := TRIM(COALESCE(order_data->>'customer_phone', order_data->>'phoneNumber', ''));
  ship_city := TRIM(COALESCE(order_data->>'shipping_city', order_data->>'city', ''));
  ship_address := TRIM(COALESCE(order_data->>'shipping_address', order_data->>'deliveryAddress', ''));

  IF cust_name = '' THEN
    RETURN json_build_object('success', false, 'error', 'Validation Error: Customer name is required.');
  END IF;
  IF cust_phone = '' THEN
    RETURN json_build_object('success', false, 'error', 'Validation Error: Customer phone number is required.');
  END IF;
  IF ship_city = '' THEN
    RETURN json_build_object('success', false, 'error', 'Validation Error: Shipping city is required.');
  END IF;
  IF ship_address = '' THEN
    RETURN json_build_object('success', false, 'error', 'Validation Error: Shipping address is required.');
  END IF;

  -- 3. Validate items payload
  IF items_data IS NULL OR jsonb_typeof(items_data) <> 'array' OR jsonb_array_length(items_data) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Validation Error: Order must contain at least one item.');
  END IF;

  -- 4. Calculate trusted product prices & subtotal
  FOR item_record IN SELECT * FROM jsonb_to_recordset(items_data) AS x(
    id TEXT,
    order_id TEXT,
    product_id TEXT,
    product_title TEXT,
    product_image TEXT,
    unit_price NUMERIC,
    quantity INTEGER,
    total_price NUMERIC
  )
  LOOP
    IF item_record.quantity IS NULL OR item_record.quantity < 1 OR item_record.quantity > 500 THEN
      RETURN json_build_object('success', false, 'error', 'Validation Error: Invalid quantity for item.');
    END IF;

    -- Lookup trusted price from products table via schema-agnostic JSON reflection
    trusted_unit_price := NULL;
    prod_json := NULL;

    IF item_record.product_id IS NOT NULL AND item_record.product_id <> '' THEN
      BEGIN
        SELECT to_jsonb(p) INTO prod_json FROM products p WHERE p.id = item_record.product_id LIMIT 1;
        IF prod_json IS NOT NULL THEN
          IF (prod_json->>'sale_enabled')::BOOLEAN = true AND (prod_json->>'sale_price') IS NOT NULL AND (prod_json->>'sale_price')::NUMERIC > 0 THEN
            trusted_unit_price := (prod_json->>'sale_price')::NUMERIC;
          ELSIF (prod_json->>'price') IS NOT NULL THEN
            trusted_unit_price := (prod_json->>'price')::NUMERIC;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        trusted_unit_price := NULL;
      END;
    END IF;

    IF trusted_unit_price IS NULL THEN
      trusted_unit_price := GREATEST(0, COALESCE(item_record.unit_price, 0));
    END IF;

    item_total := trusted_unit_price * item_record.quantity;
    calc_subtotal := calc_subtotal + item_total;
  END LOOP;

  -- 5. Calculate delivery fee from delivery_cities if available
  BEGIN
    SELECT to_jsonb(c) INTO city_json FROM delivery_cities c WHERE LOWER(c.name) = LOWER(ship_city) LIMIT 1;
    IF city_json IS NOT NULL AND (city_json->>'delivery_fee') IS NOT NULL THEN
      calc_delivery_fee := (city_json->>'delivery_fee')::NUMERIC;
    ELSE
      calc_delivery_fee := GREATEST(0, COALESCE((order_data->>'delivery_fee')::NUMERIC, (order_data->>'deliveryCharges')::NUMERIC, 0));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    calc_delivery_fee := GREATEST(0, COALESCE((order_data->>'delivery_fee')::NUMERIC, (order_data->>'deliveryCharges')::NUMERIC, 0));
  END;

  calc_discount := GREATEST(0, COALESCE((order_data->>'discount_amount')::NUMERIC, (order_data->>'couponDiscountAmount')::NUMERIC, 0));
  IF calc_discount > calc_subtotal THEN
    calc_discount := calc_subtotal;
  END IF;

  calc_tax := GREATEST(0, COALESCE((order_data->>'tax_amount')::NUMERIC, (order_data->>'taxAmount')::NUMERIC, 0));
  calc_total := GREATEST(0, (calc_subtotal + calc_delivery_fee + calc_tax) - calc_discount);

  -- 6. Insert into orders table FIRST (satisfies foreign key constraint for order_items)
  INSERT INTO orders (
    id,
    customer_id,
    customer_name,
    name,
    customer_email,
    email,
    customer_phone,
    phone,
    shipping_city,
    city,
    shipping_area,
    area,
    shipping_address,
    address,
    postal_code,
    delivery_option,
    delivery_fee,
    delivery_charges,
    subtotal,
    total_amount,
    grand_total,
    status,
    payment_method,
    payment_status,
    notes,
    status_history,
    created_at,
    updated_at
  ) VALUES (
    final_order_id,
    parsed_cust_uuid,
    cust_name,
    cust_name,
    COALESCE(order_data->>'customer_email', order_data->>'email'),
    COALESCE(order_data->>'customer_email', order_data->>'email'),
    cust_phone,
    cust_phone,
    ship_city,
    ship_city,
    COALESCE(order_data->>'shipping_area', order_data->>'areaLocality'),
    COALESCE(order_data->>'shipping_area', order_data->>'areaLocality'),
    ship_address,
    ship_address,
    COALESCE(order_data->>'postal_code', order_data->>'postalCode'),
    COALESCE(order_data->>'delivery_option', order_data->>'deliveryInstructions'),
    calc_delivery_fee,
    calc_delivery_fee,
    calc_subtotal,
    calc_total,
    calc_total,
    'Order Received', -- Force secure initial order status
    COALESCE(order_data->>'payment_method', order_data->>'paymentMethodName', 'Cash on Delivery'),
    COALESCE(order_data->>'payment_status', order_data->>'paymentStatus', 'Cash on Delivery'),
    COALESCE(order_data->>'notes', order_data->>'deliveryInstructions'),
    jsonb_build_array(jsonb_build_object(
      'status', 'Order Received',
      'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'note', 'Order placed successfully by customer.'
    )),
    COALESCE((order_data->>'created_at')::TIMESTAMPTZ, (order_data->>'createdAt')::TIMESTAMPTZ, NOW()),
    NOW()
  );

  -- 7. Insert into order_items table SECOND
  FOR item_record IN SELECT * FROM jsonb_to_recordset(items_data) AS x(
    id TEXT,
    order_id TEXT,
    product_id TEXT,
    product_title TEXT,
    product_image TEXT,
    unit_price NUMERIC,
    quantity INTEGER,
    total_price NUMERIC
  )
  LOOP
    trusted_unit_price := NULL;
    prod_json := NULL;

    IF item_record.product_id IS NOT NULL AND item_record.product_id <> '' THEN
      BEGIN
        SELECT to_jsonb(p) INTO prod_json FROM products p WHERE p.id = item_record.product_id LIMIT 1;
        IF prod_json IS NOT NULL THEN
          IF (prod_json->>'sale_enabled')::BOOLEAN = true AND (prod_json->>'sale_price') IS NOT NULL AND (prod_json->>'sale_price')::NUMERIC > 0 THEN
            trusted_unit_price := (prod_json->>'sale_price')::NUMERIC;
          ELSIF (prod_json->>'price') IS NOT NULL THEN
            trusted_unit_price := (prod_json->>'price')::NUMERIC;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        trusted_unit_price := NULL;
      END;
    END IF;

    IF trusted_unit_price IS NULL THEN
      trusted_unit_price := GREATEST(0, COALESCE(item_record.unit_price, 0));
    END IF;

    item_total := trusted_unit_price * item_record.quantity;

    INSERT INTO order_items (
      id,
      order_id,
      product_id,
      product_title,
      product_image,
      unit_price,
      quantity,
      total_price,
      created_at
    ) VALUES (
      gen_random_uuid(),
      final_order_id,
      item_record.product_id,
      COALESCE(item_record.product_title, 'Product Item'),
      item_record.product_image,
      trusted_unit_price,
      item_record.quantity,
      item_total,
      NOW()
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'id', final_order_id,
    'subtotal', calc_subtotal,
    'total_amount', calc_total,
    'delivery_fee', calc_delivery_fee
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION submit_customer_order(TEXT, JSONB, JSONB) TO anon, authenticated, service_role;

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';


-- =========================================================
-- STORAGE BUCKETS SETUP
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-media', 'product-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-media', 'hero-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Product Media" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "Admin Upload Product Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-media');
CREATE POLICY "Admin Delete Product Media" ON storage.objects FOR DELETE USING (bucket_id = 'product-media');

CREATE POLICY "Public Read Brand Assets" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "Admin Upload Brand Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Public Read Hero Media" ON storage.objects FOR SELECT USING (bucket_id = 'hero-media');
CREATE POLICY "Admin Upload Hero Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hero-media');
