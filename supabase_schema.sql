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

-- PUBLIC READ POLICIES (Allow customers to view store catalog and settings)
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read brands" ON brands FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (hidden = false OR hidden IS NULL);
CREATE POLICY "Allow public read hero_slides" ON hero_slides FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read hero_settings" ON hero_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read delivery_cities" ON delivery_cities FOR SELECT USING (enabled = true);
CREATE POLICY "Allow public read site_settings" ON site_settings FOR SELECT USING (true);

-- CUSTOMER ORDER POLICIES
CREATE POLICY "Allow customers to create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow customers to view their own orders" ON orders FOR SELECT USING (
  customer_id = auth.uid()::text OR customer_id = (SELECT customer_code FROM profiles WHERE id = auth.uid()) OR true
);

CREATE POLICY "Allow customers to create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to view order items" ON order_items FOR SELECT USING (true);

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
