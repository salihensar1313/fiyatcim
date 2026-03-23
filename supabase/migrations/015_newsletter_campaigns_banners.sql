-- ============================================================
-- Migration 015: Newsletter + Campaigns + Banner Slots
-- Tarih: 2026-03-24
-- Growth Phase 2: Merchandising & CRM altyapısı
-- ============================================================

-- ============================================================
-- 1. NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'homepage',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Sadece service_role yazabilir (API route üzerinden)
CREATE POLICY newsletter_service_only ON public.newsletter_subscribers
  FOR ALL USING (FALSE);

-- ============================================================
-- 2. CAMPAIGNS (Kampanya Landing Pages)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  banner_image TEXT DEFAULT '',
  product_ids UUID[] DEFAULT '{}',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON public.campaigns(is_active);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Public read (aktif kampanyalar), admin write
CREATE POLICY campaigns_public_read ON public.campaigns
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY campaigns_admin_write ON public.campaigns
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 3. BANNER SLOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.banner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  link TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_slot ON public.banner_slots(slot_name);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banner_slots(is_active);

ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;

-- Public read (aktif bannerlar), admin write
CREATE POLICY banners_public_read ON public.banner_slots
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY banners_admin_write ON public.banner_slots
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
