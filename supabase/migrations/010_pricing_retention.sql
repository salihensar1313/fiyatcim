-- ============================================================
-- 010: Pricing retention helpers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.price_history_archive (
  LIKE public.price_history INCLUDING DEFAULTS INCLUDING CONSTRAINTS
);

ALTER TABLE public.price_history_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_history_archive_admin_read ON public.price_history_archive
  FOR SELECT USING (public.is_admin());
CREATE POLICY price_history_archive_admin_insert ON public.price_history_archive
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY price_history_archive_no_update ON public.price_history_archive
  FOR UPDATE USING (FALSE);
CREATE POLICY price_history_archive_no_delete ON public.price_history_archive
  FOR DELETE USING (FALSE);

CREATE INDEX IF NOT EXISTS idx_price_history_archive_product_created
  ON public.price_history_archive(product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_source_scrape_logs_retention()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.source_scrape_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_pricing_decisions_retention()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.pricing_decisions
  WHERE created_at < NOW() - INTERVAL '6 months';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.archive_old_price_history()
RETURNS INT AS $$
DECLARE
  v_archived INT;
BEGIN
  INSERT INTO public.price_history_archive
  SELECT ph.*
  FROM public.price_history ph
  WHERE ph.created_at < NOW() - INTERVAL '1 year'
    AND NOT EXISTS (
      SELECT 1 FROM public.price_history_archive pha WHERE pha.id = ph.id
    );

  GET DIAGNOSTICS v_archived = ROW_COUNT;

  DELETE FROM public.price_history
  WHERE created_at < NOW() - INTERVAL '1 year';

  RETURN v_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
