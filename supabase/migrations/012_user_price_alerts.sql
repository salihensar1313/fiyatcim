-- User price/stock alerts
CREATE TABLE IF NOT EXISTS public.user_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price', 'stock')),
  target_price NUMERIC,
  current_price_at_creation NUMERIC,
  email TEXT NOT NULL,
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, alert_type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_active ON public.user_price_alerts(is_active, is_triggered) WHERE is_active = TRUE AND is_triggered = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_user ON public.user_price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_product ON public.user_price_alerts(product_id);

-- RLS
ALTER TABLE public.user_price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.user_price_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.user_price_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.user_price_alerts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.user_price_alerts
  FOR ALL USING (auth.role() = 'service_role');
