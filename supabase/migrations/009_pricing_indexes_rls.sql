-- ============================================================
-- 009: Pricing indexes + RLS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_price_source_id
  ON public.products(price_source_id);

CREATE INDEX IF NOT EXISTS idx_products_price_locked
  ON public.products(price_locked);

CREATE INDEX IF NOT EXISTS idx_price_sources_product_status_confidence
  ON public.price_sources(product_id, status, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_price_sources_site_status
  ON public.price_sources(source_site_id, status);

CREATE INDEX IF NOT EXISTS idx_price_sources_last_checked
  ON public.price_sources(last_checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_product_created
  ON public.price_history(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_source_created
  ON public.price_history(source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_alerts_unresolved
  ON public.price_alerts(created_at DESC)
  WHERE is_resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_price_alerts_product_unresolved
  ON public.price_alerts(product_id, created_at DESC)
  WHERE is_resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_source_scrape_logs_source_created
  ON public.source_scrape_logs(source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pricing_decisions_product_created
  ON public.pricing_decisions(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pricing_jobs_status_created
  ON public.pricing_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_sites_active_priority
  ON public.source_sites(is_active, priority);

ALTER TABLE public.source_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY source_sites_admin_read ON public.source_sites
  FOR SELECT USING (public.is_admin());
CREATE POLICY source_sites_admin_insert ON public.source_sites
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY source_sites_admin_update ON public.source_sites
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY source_sites_no_delete ON public.source_sites
  FOR DELETE USING (FALSE);

CREATE POLICY price_sources_admin_read ON public.price_sources
  FOR SELECT USING (public.is_admin());
CREATE POLICY price_sources_admin_insert ON public.price_sources
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY price_sources_admin_update ON public.price_sources
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY price_sources_no_delete ON public.price_sources
  FOR DELETE USING (FALSE);

CREATE POLICY price_history_admin_read ON public.price_history
  FOR SELECT USING (public.is_admin());
CREATE POLICY price_history_admin_insert ON public.price_history
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY price_history_admin_update ON public.price_history
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY price_history_no_delete ON public.price_history
  FOR DELETE USING (FALSE);

CREATE POLICY pricing_rules_admin_read ON public.pricing_rules
  FOR SELECT USING (public.is_admin());
CREATE POLICY pricing_rules_admin_insert ON public.pricing_rules
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY pricing_rules_admin_update ON public.pricing_rules
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pricing_rules_no_delete ON public.pricing_rules
  FOR DELETE USING (FALSE);

CREATE POLICY price_alerts_admin_read ON public.price_alerts
  FOR SELECT USING (public.is_admin());
CREATE POLICY price_alerts_admin_insert ON public.price_alerts
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY price_alerts_admin_update ON public.price_alerts
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY price_alerts_no_delete ON public.price_alerts
  FOR DELETE USING (FALSE);

CREATE POLICY source_scrape_logs_admin_read ON public.source_scrape_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY source_scrape_logs_admin_insert ON public.source_scrape_logs
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY source_scrape_logs_admin_update ON public.source_scrape_logs
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY source_scrape_logs_no_delete ON public.source_scrape_logs
  FOR DELETE USING (FALSE);

CREATE POLICY pricing_decisions_admin_read ON public.pricing_decisions
  FOR SELECT USING (public.is_admin());
CREATE POLICY pricing_decisions_admin_insert ON public.pricing_decisions
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY pricing_decisions_admin_update ON public.pricing_decisions
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pricing_decisions_no_delete ON public.pricing_decisions
  FOR DELETE USING (FALSE);

CREATE POLICY pricing_jobs_admin_read ON public.pricing_jobs
  FOR SELECT USING (public.is_admin());
CREATE POLICY pricing_jobs_admin_insert ON public.pricing_jobs
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY pricing_jobs_admin_update ON public.pricing_jobs
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY pricing_jobs_no_delete ON public.pricing_jobs
  FOR DELETE USING (FALSE);
