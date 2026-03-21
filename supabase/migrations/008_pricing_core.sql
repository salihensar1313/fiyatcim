-- ============================================================
-- 008: Pricing core schema
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC CHECK (cost_price IS NULL OR cost_price >= 0),
  ADD COLUMN IF NOT EXISTS cost_currency TEXT,
  ADD COLUMN IF NOT EXISTS price_source_id UUID,
  ADD COLUMN IF NOT EXISTS price_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.source_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INT NOT NULL DEFAULT 100,
  rate_limit_ms INT NOT NULL DEFAULT 1000 CHECK (rate_limit_ms >= 0),
  selectors JSONB NOT NULL DEFAULT '{}',
  extractor_config JSONB NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}',
  health_score NUMERIC NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  total_scrapes_30d INT NOT NULL DEFAULT 0 CHECK (total_scrapes_30d >= 0),
  successful_scrapes_30d INT NOT NULL DEFAULT 0 CHECK (successful_scrapes_30d >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT source_sites_success_le_total CHECK (successful_scrapes_30d <= total_scrapes_30d)
);

CREATE TABLE IF NOT EXISTS public.price_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  source_site_id UUID NOT NULL REFERENCES public.source_sites(id) ON DELETE RESTRICT,
  source_url TEXT NOT NULL,
  source_sku TEXT,
  source_brand TEXT,
  source_title TEXT,
  status TEXT NOT NULL DEFAULT 'manual_review'
    CHECK (status IN ('active', 'fallback_candidate', 'blocked', 'not_found', 'invalid_match', 'manual_review', 'disabled')),
  match_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method TEXT CHECK (verification_method IN ('auto', 'manual') OR verification_method IS NULL),
  match_score NUMERIC NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  manual_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  review_reason TEXT,
  last_price NUMERIC CHECK (last_price IS NULL OR last_price >= 0),
  last_price_currency TEXT,
  last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  confidence_score NUMERIC NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  failure_count INT NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  check_interval_hours INT NOT NULL DEFAULT 24 CHECK (check_interval_hours > 0),
  custom_selectors JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT price_sources_product_site_unique UNIQUE (product_id, source_site_id)
);

CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  source_id UUID REFERENCES public.price_sources(id) ON DELETE RESTRICT,
  price_type TEXT NOT NULL CHECK (price_type IN ('source_cost', 'sale_price', 'manual_override')),
  old_price NUMERIC CHECK (old_price IS NULL OR old_price >= 0),
  new_price NUMERIC NOT NULL CHECK (new_price >= 0),
  currency TEXT,
  change_percent NUMERIC,
  change_reason TEXT,
  changed_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('global', 'brand', 'category', 'product')),
  target_id UUID,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  margin_percent NUMERIC NOT NULL DEFAULT 0 CHECK (margin_percent >= 0),
  min_margin_amount NUMERIC CHECK (min_margin_amount IS NULL OR min_margin_amount >= 0),
  max_price NUMERIC CHECK (max_price IS NULL OR max_price >= 0),
  min_price NUMERIC CHECK (min_price IS NULL OR min_price >= 0),
  rounding_strategy TEXT NOT NULL DEFAULT 'none'
    CHECK (rounding_strategy IN ('none', 'round_99', 'round_nearest_10')),
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_rules_price_range_valid CHECK (min_price IS NULL OR max_price IS NULL OR min_price <= max_price)
);

CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  source_id UUID REFERENCES public.price_sources(id) ON DELETE RESTRICT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.source_scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.price_sources(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('success', 'blocked', 'not_found', 'failed', 'manual_review')),
  http_status INT,
  response_time_ms INT CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
  extractor_used TEXT,
  extracted_price NUMERIC CHECK (extracted_price IS NULL OR extracted_price >= 0),
  extracted_title TEXT,
  extracted_brand TEXT,
  extracted_sku TEXT,
  title_match_score NUMERIC CHECK (title_match_score IS NULL OR (title_match_score >= 0 AND title_match_score <= 100)),
  error_message TEXT,
  raw_html_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT source_scrape_logs_raw_html_len CHECK (raw_html_snippet IS NULL OR char_length(raw_html_snippet) <= 500)
);

CREATE TABLE IF NOT EXISTS public.pricing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  selected_source_id UUID REFERENCES public.price_sources(id) ON DELETE RESTRICT,
  source_price NUMERIC CHECK (source_price IS NULL OR source_price >= 0),
  source_currency TEXT,
  applied_rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE SET NULL,
  margin_percent_applied NUMERIC,
  calculated_price NUMERIC CHECK (calculated_price IS NULL OR calculated_price >= 0),
  final_price NUMERIC CHECK (final_price IS NULL OR final_price >= 0),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('auto_update', 'fallback', 'manual_override', 'rule_change')),
  confidence_at_decision NUMERIC CHECK (confidence_at_decision IS NULL OR (confidence_at_decision >= 0 AND confidence_at_decision <= 100)),
  rejection_reasons JSONB NOT NULL DEFAULT '[]',
  was_price_locked BOOLEAN NOT NULL DEFAULT FALSE,
  price_actually_updated BOOLEAN NOT NULL DEFAULT FALSE,
  decided_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('batch_scrape', 'batch_price_update', 'batch_margin_change', 'csv_import')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  total_items INT NOT NULL DEFAULT 0 CHECK (total_items >= 0),
  processed_items INT NOT NULL DEFAULT 0 CHECK (processed_items >= 0),
  success_count INT NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count INT NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  skipped_count INT NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  triggered_by UUID REFERENCES auth.users(id),
  filters JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_jobs_progress_valid CHECK (
    processed_items <= total_items
    AND success_count + failure_count + skipped_count <= processed_items
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_price_source_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_source_id_fkey
      FOREIGN KEY (price_source_id) REFERENCES public.price_sources(id) ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['source_sites', 'price_sources', 'pricing_rules']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
