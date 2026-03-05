-- ============================================================
-- Fiyatcim E-Ticaret — Initial Schema Migration
-- ============================================================

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (auto-created on auth.users insert)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ad TEXT NOT NULL DEFAULT '',
  soyad TEXT NOT NULL DEFAULT '',
  telefon TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT,
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  price NUMERIC NOT NULL CHECK (price >= 0),
  sale_price NUMERIC CHECK (sale_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  critical_stock INT DEFAULT 5,
  tax_rate NUMERIC NOT NULL DEFAULT 20,
  warranty_months INT DEFAULT 24,
  shipping_type TEXT DEFAULT 'kargo' CHECK (shipping_type IN ('kargo', 'kurulum')),
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  short_desc TEXT,
  description TEXT,
  specs JSONB DEFAULT '{}',
  images JSONB DEFAULT '[]',
  seo_title TEXT,
  seo_desc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  min_cart NUMERIC DEFAULT 0,
  max_uses INT,  -- NULL = sınırsız
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  expiry TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT CHECK (payment_provider IN ('iyzico', 'paytr')),
  payment_ref TEXT,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  shipping NUMERIC NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  discount NUMERIC NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY',
  shipping_address JSONB,
  billing_address JSONB,
  shipping_company TEXT,
  tracking_no TEXT,
  coupon_id UUID REFERENCES public.coupons(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- payment_ref unique per provider
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_ref_unique
  ON public.orders(payment_provider, payment_ref)
  WHERE payment_ref IS NOT NULL;

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  name_snapshot TEXT NOT NULL,
  price_snapshot NUMERIC NOT NULL,
  sale_price_snapshot NUMERIC,
  tax_rate_snapshot NUMERIC NOT NULL DEFAULT 20,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  qty INT NOT NULL DEFAULT 1
);

-- Aynı siparişte aynı üründen tek satır
CREATE UNIQUE INDEX IF NOT EXISTS order_items_unique_product_per_order
  ON public.order_items(order_id, product_id)
  WHERE product_id IS NOT NULL;

-- Order Status Logs
CREATE TABLE IF NOT EXISTS public.order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- is_admin() — RLS helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- set_updated_at() — auto-update trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles', 'categories', 'brands', 'products', 'coupons', 'orders', 'site_settings']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- PROFILE AUTO-CREATE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, ad, soyad, role)
  VALUES (NEW.id, '', '', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ORDER NUMBER GENERATION
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.order_no_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_order_no()
RETURNS TRIGGER AS $$
DECLARE
  v_order_no TEXT;
  v_exists BOOLEAN;
BEGIN
  IF NEW.order_no IS NULL OR LENGTH(TRIM(NEW.order_no)) = 0 THEN
    LOOP
      v_order_no := 'FY-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
        LPAD(NEXTVAL('public.order_no_seq')::TEXT, 6, '0');
      SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_no = v_order_no) INTO v_exists;
      EXIT WHEN NOT v_exists;
    END LOOP;
    NEW.order_no := v_order_no;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_generate_order_no
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_no();

-- ============================================================
-- PAYMENT FIELDS PROTECTION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_payment_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Bypass flag is set only inside finalize RPCs (transaction-local)
  IF current_setting('app.bypass_payment_protection', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF NEW.payment_status != OLD.payment_status THEN
    RAISE EXCEPTION 'payment_status can only be changed via finalize RPC';
  END IF;
  IF NEW.payment_ref IS DISTINCT FROM OLD.payment_ref THEN
    RAISE EXCEPTION 'payment_ref can only be changed via finalize RPC';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_protect_payment
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.protect_payment_fields();

-- ============================================================
-- create_order_rpc — Atomic order creation
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order_rpc(
  p_cart_items JSONB,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_provider TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order_id UUID;
  v_product RECORD;
  v_item RECORD;
  v_subtotal NUMERIC := 0;
  v_shipping NUMERIC;
  v_discount NUMERIC := 0;
  v_coupon_id UUID := NULL;
  v_coupon RECORD;
  v_effective_price NUMERIC;
BEGIN
  -- 0) Auth required
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 1) Validate payment_provider
  IF p_payment_provider IS NOT NULL AND p_payment_provider NOT IN ('iyzico', 'paytr') THEN
    RAISE EXCEPTION 'Invalid payment provider: %. Must be iyzico or paytr', p_payment_provider;
  END IF;

  -- 2) Validate products & calculate subtotal (DB prices, not frontend)
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(product_id UUID, qty INT)
  LOOP
    SELECT * INTO v_product FROM public.products
    WHERE id = v_item.product_id AND is_active = TRUE AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_item.product_id;
    END IF;
    IF v_product.stock < v_item.qty THEN
      RAISE EXCEPTION 'Insufficient stock: %', v_item.product_id;
    END IF;
    v_effective_price := COALESCE(v_product.sale_price, v_product.price);
    v_subtotal := v_subtotal + (v_effective_price * v_item.qty);
  END LOOP;

  -- 3) Validate coupon & calculate discount (used_count NOT incremented here)
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons
    WHERE code = UPPER(TRIM(p_coupon_code))
      AND active = TRUE
      AND (expiry IS NULL OR expiry > NOW())
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (max_uses IS NULL OR used_count < max_uses)
      AND min_cart <= v_subtotal;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired coupon: %', p_coupon_code;
    END IF;
    v_coupon_id := v_coupon.id;
    IF v_coupon.type = 'percent' THEN
      v_discount := ROUND(v_subtotal * v_coupon.value / 100, 2);
    ELSIF v_coupon.type = 'fixed' THEN
      v_discount := LEAST(v_coupon.value, v_subtotal);
    END IF;
  END IF;

  -- 4) Shipping (MVP: >= 2000 TRY free, else 49.90)
  v_shipping := CASE WHEN v_subtotal >= 2000 THEN 0 ELSE 49.90 END;

  -- 5) Create order
  INSERT INTO public.orders (
    user_id, status, payment_status, payment_provider,
    subtotal, shipping, discount, total, currency,
    shipping_address, billing_address, coupon_id, notes
  ) VALUES (
    v_user_id, 'pending_payment', 'pending', p_payment_provider,
    v_subtotal, v_shipping, v_discount,
    v_subtotal - v_discount + v_shipping, 'TRY',
    p_shipping_address, p_billing_address, v_coupon_id, p_notes
  ) RETURNING id INTO v_order_id;

  -- 6) Create order items (snapshot prices + KDV calculation)
  INSERT INTO public.order_items (
    order_id, product_id, name_snapshot, price_snapshot,
    sale_price_snapshot, tax_rate_snapshot, tax_amount, discount_amount, qty
  )
  SELECT
    v_order_id, p.id, p.name, p.price,
    p.sale_price, p.tax_rate,
    ROUND(COALESCE(p.sale_price, p.price) * x.qty * p.tax_rate / (100 + p.tax_rate), 2),
    0, x.qty
  FROM jsonb_to_recordset(p_cart_items) AS x(product_id UUID, qty INT)
  JOIN public.products p ON p.id = x.product_id;

  -- 7) Status log
  INSERT INTO public.order_status_logs (order_id, old_status, new_status, changed_by)
  VALUES (v_order_id, NULL, 'pending_payment', v_user_id);

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only authenticated users can call
REVOKE ALL ON FUNCTION public.create_order_rpc(JSONB, JSONB, JSONB, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order_rpc(JSONB, JSONB, JSONB, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================
-- finalize_paid_order — Webhook payment success
-- ============================================================

CREATE OR REPLACE FUNCTION public.finalize_paid_order(p_order_id UUID, p_payment_ref TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  item RECORD;
  affected INT;
BEGIN
  -- 0) Bypass payment protection trigger
  PERFORM set_config('app.bypass_payment_protection', 'true', true);

  -- 1) Lock order + idempotency
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Already paid → idempotent no-op
  IF v_order.payment_status = 'success' THEN RETURN TRUE; END IF;

  -- Cancelled/refunded → cannot process payment
  IF v_order.status IN ('cancelled', 'refunded') THEN RETURN TRUE; END IF;

  -- Only process pending payments
  IF v_order.payment_status != 'pending' THEN RETURN TRUE; END IF;

  -- 2) Cross-order payment_ref guard (provider-scoped)
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE payment_provider = v_order.payment_provider
      AND payment_ref = p_payment_ref
      AND id != p_order_id
  ) THEN
    RAISE EXCEPTION 'Duplicate payment_ref for provider %: %', v_order.payment_provider, p_payment_ref;
  END IF;

  -- 3) Deduct stock (all-or-nothing with row locks)
  FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = p_order_id
  LOOP
    PERFORM 1 FROM public.products WHERE id = item.product_id FOR UPDATE;
    UPDATE public.products SET stock = stock - item.qty
    WHERE id = item.product_id AND stock >= item.qty AND deleted_at IS NULL;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 0 THEN
      RAISE EXCEPTION 'Insufficient stock: %', item.product_id;
    END IF;
  END LOOP;

  -- 4) Update order
  UPDATE public.orders
  SET status = 'paid', payment_status = 'success', payment_ref = p_payment_ref
  WHERE id = p_order_id;

  -- 5) Status log
  INSERT INTO public.order_status_logs (order_id, old_status, new_status, changed_by)
  VALUES (p_order_id, v_order.status, 'paid', NULL);

  -- 6) Increment coupon used_count (atomic)
  IF v_order.coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1
    WHERE id = v_order.coupon_id AND (max_uses IS NULL OR used_count < max_uses);
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 0 THEN
      RAISE EXCEPTION 'Coupon limit exceeded: %', v_order.coupon_id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only service_role (Edge Functions) can call
REVOKE ALL ON FUNCTION public.finalize_paid_order(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(UUID, TEXT) TO service_role;

-- ============================================================
-- finalize_refund_order — Webhook refund
-- ============================================================

CREATE OR REPLACE FUNCTION public.finalize_refund_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  item RECORD;
BEGIN
  -- Bypass payment protection trigger
  PERFORM set_config('app.bypass_payment_protection', 'true', true);

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  -- Idempotent
  IF v_order.payment_status = 'refunded' THEN RETURN TRUE; END IF;

  -- Only paid orders can be refunded
  IF v_order.payment_status != 'success' THEN
    RAISE EXCEPTION 'Only paid orders can be refunded';
  END IF;

  -- Restore stock (no deleted_at filter — soft-deleted products still get stock back)
  FOR item IN SELECT product_id, qty FROM public.order_items WHERE order_id = p_order_id
  LOOP
    PERFORM 1 FROM public.products WHERE id = item.product_id FOR UPDATE;
    UPDATE public.products SET stock = stock + item.qty WHERE id = item.product_id;
  END LOOP;

  -- Update order
  UPDATE public.orders
  SET status = 'refunded', payment_status = 'refunded'
  WHERE id = p_order_id;

  -- Status log
  INSERT INTO public.order_status_logs (order_id, old_status, new_status, changed_by)
  VALUES (p_order_id, v_order.status, 'refunded', NULL);

  -- Decrement coupon used_count (refund returns coupon usage)
  IF v_order.coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = GREATEST(0, used_count - 1)
    WHERE id = v_order.coupon_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.finalize_refund_order(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.finalize_refund_order(UUID) TO service_role;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.profiles p2 WHERE p2.user_id = auth.uid())
  );

CREATE POLICY profiles_admin_read ON public.profiles
  FOR SELECT USING (public.is_admin());

-- ---- CATEGORIES ----
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT USING (TRUE);

CREATE POLICY categories_admin_write ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- BRANDS ----
CREATE POLICY brands_public_read ON public.brands
  FOR SELECT USING (TRUE);

CREATE POLICY brands_admin_write ON public.brands
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- PRODUCTS ----
-- Public: only active, non-deleted
CREATE POLICY products_public_read ON public.products
  FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);

-- Admin: read ALL (including inactive/deleted)
CREATE POLICY products_admin_read ON public.products
  FOR SELECT USING (public.is_admin());

-- Admin: write
CREATE POLICY products_admin_write ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY products_admin_update ON public.products
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- No hard delete — nobody can DELETE products
CREATE POLICY products_no_hard_delete ON public.products
  FOR DELETE USING (FALSE);

-- ---- COUPONS ----
CREATE POLICY coupons_admin_all ON public.coupons
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- ORDERS ----
-- User: read own orders
CREATE POLICY orders_user_read ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- No direct INSERT — orders created only via create_order_rpc
CREATE POLICY orders_no_direct_insert ON public.orders
  FOR INSERT WITH CHECK (FALSE);

-- Admin: read all
CREATE POLICY orders_admin_read ON public.orders
  FOR SELECT USING (public.is_admin());

-- Admin: update (payment fields protected by trigger)
CREATE POLICY orders_admin_update ON public.orders
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- ORDER ITEMS ----
CREATE POLICY order_items_user_read ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY order_items_admin_read ON public.order_items
  FOR SELECT USING (public.is_admin());

-- ---- ORDER STATUS LOGS ----
CREATE POLICY order_status_logs_user_read ON public.order_status_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY order_status_logs_admin_read ON public.order_status_logs
  FOR SELECT USING (public.is_admin());

-- ---- REVIEWS ----
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY reviews_user_insert ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY reviews_admin_all ON public.reviews
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- AUDIT LOGS ----
CREATE POLICY audit_logs_admin_read ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- ---- SITE SETTINGS ----
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT USING (TRUE);

CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
