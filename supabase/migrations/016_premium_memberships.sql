-- ============================================
-- Migration 016: Premium Üyelik Sistemi
-- Tarih: 2026-03-24
-- ============================================

-- 1. Premium Üyelik Tablosu
CREATE TABLE IF NOT EXISTS public.user_premium_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  purchased_with_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  price_paid NUMERIC NOT NULL CHECK (price_paid > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('with_order', 'standalone', 'admin_granted')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = süresiz
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles tablosuna premium alanları ekle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- 3. İndeksler
CREATE INDEX IF NOT EXISTS idx_premium_user ON public.user_premium_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_status ON public.user_premium_memberships(status);
CREATE INDEX IF NOT EXISTS idx_premium_expires ON public.user_premium_memberships(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON public.profiles(is_premium) WHERE is_premium = TRUE;

-- 4. RLS
ALTER TABLE public.user_premium_memberships ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi premium kaydını okuyabilir
CREATE POLICY premium_user_read ON public.user_premium_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Admin tümünü okuyabilir
CREATE POLICY premium_admin_read ON public.user_premium_memberships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Sadece service_role insert/update yapabilir (API route üzerinden)
CREATE POLICY premium_service_insert ON public.user_premium_memberships
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY premium_service_update ON public.user_premium_memberships
  FOR UPDATE USING (TRUE);

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_premium_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_premium_updated_at
  BEFORE UPDATE ON public.user_premium_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_updated_at();

-- 6. Premium durum sync trigger (membership → profiles.is_premium)
CREATE OR REPLACE FUNCTION sync_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Kullanıcının aktif premium kaydı var mı kontrol et
  UPDATE public.profiles
  SET
    is_premium = EXISTS (
      SELECT 1 FROM public.user_premium_memberships
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    ),
    premium_expires_at = (
      SELECT MAX(expires_at) FROM public.user_premium_memberships
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status = 'active'
    )
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_premium_status
  AFTER INSERT OR UPDATE OR DELETE ON public.user_premium_memberships
  FOR EACH ROW
  EXECUTE FUNCTION sync_premium_status();

-- 7. Premium durum kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_premium_memberships
    WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
