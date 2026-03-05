-- ============================================================
-- 004: USD fiyat kolonları + indirim constraint
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC CHECK (price_usd >= 0),
  ADD COLUMN IF NOT EXISTS sale_price_usd NUMERIC CHECK (sale_price_usd >= 0);

-- İndirimli fiyat normal fiyattan büyük olamaz
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_sale_lte_price'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_sale_lte_price CHECK (sale_price IS NULL OR sale_price <= price);
  END IF;
END;
$$;
