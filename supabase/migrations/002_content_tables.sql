-- ==========================================
-- Fiyatcim.com — İçerik Yönetimi Tabloları
-- 001'de olmayan tablolar burada ekleniyor
-- ==========================================

-- ==========================================
-- HERO_SLIDES (Ana Sayfa Slider)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image TEXT DEFAULT '',
  cta_text TEXT DEFAULT 'Incele',
  cta_link TEXT DEFAULT '/urunler',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY hero_slides_public_read ON public.hero_slides
  FOR SELECT USING (is_active = true);

CREATE POLICY hero_slides_admin_all ON public.hero_slides
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- BLOG_POSTS (Blog Yazıları)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  image TEXT DEFAULT '',
  category TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_posts_public_read ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY blog_posts_admin_all ON public.blog_posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at trigger
CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- TESTIMONIALS (Müşteri Yorumları / Referanslar)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  comment TEXT NOT NULL,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY testimonials_public_read ON public.testimonials
  FOR SELECT USING (true);

CREATE POLICY testimonials_admin_all ON public.testimonials
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- FAQS (Sıkça Sorulan Sorular)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'genel',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY faqs_public_read ON public.faqs
  FOR SELECT USING (true);

CREATE POLICY faqs_admin_all ON public.faqs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- TRUST_BADGES (Güven Rozetleri)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'ShieldCheck',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY trust_badges_public_read ON public.trust_badges
  FOR SELECT USING (true);

CREATE POLICY trust_badges_admin_all ON public.trust_badges
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- SEO_PAGES (Sayfa Bazlı SEO Ayarları)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY seo_pages_public_read ON public.seo_pages
  FOR SELECT USING (true);

CREATE POLICY seo_pages_admin_all ON public.seo_pages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- ADMIN_NOTIFICATIONS (Bildirimler)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('order', 'registration', 'stock', 'review', 'general')),
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_notifications_admin_all ON public.admin_notifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON public.hero_slides(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_seo_pages_path ON public.seo_pages(page_path);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(is_read, created_at DESC);
