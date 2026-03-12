-- 006: Addresses & Returns tables + reviews→profiles FK fix

-- ========================================
-- ADDRESSES
-- ========================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL DEFAULT '',
  ad TEXT NOT NULL DEFAULT '',
  soyad TEXT NOT NULL DEFAULT '',
  telefon TEXT NOT NULL DEFAULT '',
  il TEXT NOT NULL DEFAULT '',
  ilce TEXT NOT NULL DEFAULT '',
  adres TEXT NOT NULL DEFAULT '',
  posta_kodu TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- User can CRUD own addresses
CREATE POLICY addresses_user_select ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY addresses_user_insert ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY addresses_user_update ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY addresses_user_delete ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can read all
CREATE POLICY addresses_admin_select ON public.addresses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- ========================================
-- RETURNS
-- ========================================
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT 'changed_mind',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  refund_amount NUMERIC(12,2),
  rejection_reason TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- User can view own returns
CREATE POLICY returns_user_select ON public.returns
  FOR SELECT USING (auth.uid() = user_id);

-- User can create returns for own orders
CREATE POLICY returns_user_insert ON public.returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can do everything
CREATE POLICY returns_admin_all ON public.returns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

-- ========================================
-- REVIEWS → PROFILES FK (for PostgREST join)
-- ========================================
-- Add explicit FK from reviews.user_id to profiles.user_id
-- This allows Supabase to resolve the join: reviews → profiles
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_profile_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;

-- ========================================
-- Updated_at triggers
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
