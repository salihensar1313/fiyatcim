-- ============================================================
-- Migration 013: RLS Policy Hardening
-- Tarih: 2026-03-23
-- Amaç: audit_logs ve site_settings tablolarının güvenlik
--        policy'lerini sıkılaştırma
-- Referans: claude2-detailed-security-report-2026-03-23.md
-- ============================================================

-- ============================================================
-- 1. AUDIT_LOGS — Mevcut: sadece admin SELECT
--    Eklenen: admin INSERT + tüm diğer işlemleri engelle
-- ============================================================

-- Admin'in log yazabilmesi için INSERT policy
-- (Server-side admin route üzerinden audit_logs'a yazma yapılır)
CREATE POLICY audit_logs_admin_insert ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- Kimse audit log silemez veya güncelleyemez (immutable log)
-- Not: UPDATE ve DELETE policy'si olmadığından RLS zaten engelliyor,
-- ama explicit olarak deny etmek daha güvenli
CREATE POLICY audit_logs_no_update ON public.audit_logs
  FOR UPDATE USING (FALSE);

CREATE POLICY audit_logs_no_delete ON public.audit_logs
  FOR DELETE USING (FALSE);

-- ============================================================
-- 2. SITE_SETTINGS — Tablo ikiye bölünüyor:
--    - Public alanlar (site adı, telefon, adres): herkese açık
--    - Secret alanlar: hiç tutulmamalı (env/vault)
--
--    Mevcut tablo yapısını bozmamak için:
--    - Public read policy'yi daraltıp sadece bilinen
--      güvenli key'lere izin veriyoruz
--    - Secret key pattern'li satırları engellyoruz
-- ============================================================

-- Mevcut herkese açık read policy'yi kaldır
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;

-- Yeni daraltılmış public read: sadece güvenli key'ler okunabilir
-- Secret key'ler (api_key, secret, password, smtp_pass, token) engellenir
CREATE POLICY site_settings_public_read_safe ON public.site_settings
  FOR SELECT USING (
    public.is_admin()
    OR (
      key NOT ILIKE '%api_key%'
      AND key NOT ILIKE '%secret%'
      AND key NOT ILIKE '%password%'
      AND key NOT ILIKE '%smtp_pass%'
      AND key NOT ILIKE '%token%'
      AND key NOT ILIKE '%credential%'
      AND key NOT ILIKE '%private%'
    )
  );

-- Admin write policy zaten var (site_settings_admin_write), dokunmuyoruz

-- ============================================================
-- 3. YORUM: Diğer tabloların durumu (bilgi amaçlı)
-- ============================================================
-- profiles: OK — select own + admin all
-- categories: OK — public read + admin write
-- brands: OK — public read + admin write
-- products: OK — public read active + admin all
-- orders: OK — select own + admin all
-- order_items: OK — select own order items
-- reviews: OK — public read approved + admin all
-- coupons: OK — admin only
-- pricing tables: OK — admin only (009_pricing_indexes_rls.sql)
-- user_price_alerts: OK — select own + admin all

-- ============================================================
-- 4. Hero Slide Görselleri: PNG → WebP
-- Performans: 10.3 MB → 0.39 MB (%96 azalma)
-- ============================================================
UPDATE public.hero_slides
  SET image = REPLACE(image, '.png', '.webp')
  WHERE image LIKE '%/images/hero/%.png';
