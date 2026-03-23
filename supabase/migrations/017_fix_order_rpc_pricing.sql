-- ============================================================
-- Migration 017: Fix create_order_rpc pricing bug
-- Problem: sale_price = 0 when there's no sale causes subtotal = 0
-- Solution: Use NULLIF(sale_price, 0) consistently everywhere
-- ============================================================

-- Drop and recreate the function with corrected pricing logic
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
    -- FIX: NULLIF(sale_price, 0) ensures 0 is treated as "no sale"
    v_effective_price := COALESCE(NULLIF(v_product.sale_price, 0), v_product.price);
    v_subtotal := v_subtotal + (v_effective_price * v_item.qty);
  END LOOP;

  -- 3) Validate coupon & calculate discount
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

  -- 4) Shipping (Premium users: free, Regular: >= 2000 TRY free, else 49.90)
  -- Check if user is premium
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id
      AND is_premium = TRUE
      AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
  ) THEN
    v_shipping := 0;
  ELSE
    v_shipping := CASE WHEN v_subtotal >= 2000 THEN 0 ELSE 49.90 END;
  END IF;

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
  -- FIX: Use NULLIF(sale_price, 0) to prevent 0 sale_price in snapshots
  INSERT INTO public.order_items (
    order_id, product_id, name_snapshot, price_snapshot,
    sale_price_snapshot, tax_rate_snapshot, tax_amount, discount_amount, qty
  )
  SELECT
    v_order_id, p.id, p.name, p.price,
    NULLIF(p.sale_price, 0),  -- Store NULL instead of 0
    p.tax_rate,
    ROUND(
      COALESCE(NULLIF(p.sale_price, 0), p.price) * x.qty * p.tax_rate / (100 + p.tax_rate),
      2
    ),
    0, x.qty
  FROM jsonb_to_recordset(p_cart_items) AS x(product_id UUID, qty INT)
  JOIN public.products p ON p.id = x.product_id;

  -- 7) Decrement stock
  UPDATE public.products p
  SET stock = p.stock - x.qty
  FROM jsonb_to_recordset(p_cart_items) AS x(product_id UUID, qty INT)
  WHERE p.id = x.product_id;

  -- 8) Status log
  INSERT INTO public.order_status_logs (order_id, old_status, new_status, changed_by)
  VALUES (v_order_id, NULL, 'pending_payment', v_user_id);

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only authenticated users can call
REVOKE ALL ON FUNCTION public.create_order_rpc(JSONB, JSONB, JSONB, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order_rpc(JSONB, JSONB, JSONB, TEXT, TEXT, TEXT) TO authenticated;
