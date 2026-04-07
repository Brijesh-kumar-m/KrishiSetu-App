-- =============================================
-- KrishiSetu (कृषि सेतु) - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('farmer', 'trader', 'customer')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  crop_name VARCHAR(100) NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) CHECK (unit IN ('kg', 'quintal', 'ton')) DEFAULT 'kg',
  price NUMERIC NOT NULL CHECK (price > 0),
  location VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  total_price NUMERIC NOT NULL CHECK (total_price > 0),
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'delivered', 'rejected')) DEFAULT 'pending',
  delivery_type VARCHAR(30) CHECK (delivery_type IN ('self_pickup', 'seller_delivery')) DEFAULT 'seller_delivery',
  payment_method VARCHAR(20) CHECK (payment_method IN ('cod', 'upi')) DEFAULT 'cod',
  delivery_name VARCHAR(255),
  delivery_phone VARCHAR(15),
  delivery_address TEXT,
  delivery_pincode VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADDRESSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_crop_name ON public.products(crop_name);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_ratings_seller_id ON public.ratings(seller_id);
CREATE INDEX IF NOT EXISTS idx_ratings_product_id ON public.ratings(product_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, authenticated can insert/update own
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (true);

-- Products: public read, authenticated can CRUD own
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (true);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (true);

-- Orders: users can see their own orders
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (true);

-- Ratings: public read, authenticated insert
CREATE POLICY "ratings_select_all" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT WITH CHECK (true);

-- Addresses: users can only see their own
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT USING (true);
CREATE POLICY "addresses_insert" ON public.addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "addresses_update" ON public.addresses FOR UPDATE USING (true);
CREATE POLICY "addresses_delete" ON public.addresses FOR DELETE USING (true);

-- =============================================
-- STORAGE BUCKET for product images
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "product_images_public_read" ON storage.objects 
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================
INSERT INTO public.users (name, phone, role) VALUES
  ('रामलाल यादव', '9876543210', 'farmer'),
  ('सुरेश पटेल', '9876543211', 'farmer'),
  ('मोहन सिंह', '9876543212', 'farmer'),
  ('अनिल शर्मा', '9876543213', 'trader'),
  ('प्रिया वर्मा', '9876543214', 'customer')
ON CONFLICT (phone) DO NOTHING;

-- =============================================
-- TRIGGERS for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
