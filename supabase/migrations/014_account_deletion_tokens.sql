-- ============================================================
-- Migration 014: Account Deletion Token Table
-- Tarih: 2026-03-24
-- Amaç: Hesap silme e-posta onay sistemi
-- Akış: Kullanıcı silme ister → token oluşturulur → mail gider
--        → Kullanıcı maildeki linke tıklar → hesap silinir
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_deletion_tokens_token ON public.account_deletion_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_deletion_tokens_expires ON public.account_deletion_tokens(expires_at);

-- RLS
ALTER TABLE public.account_deletion_tokens ENABLE ROW LEVEL SECURITY;

-- Sadece service_role erişebilir (API route'lar service key kullanır)
-- Normal kullanıcılar bu tabloya doğrudan erişemez
CREATE POLICY deletion_tokens_service_only ON public.account_deletion_tokens
  FOR ALL USING (FALSE);

-- 24 saatten eski token'ları temizle (opsiyonel cron ile)
-- DELETE FROM public.account_deletion_tokens WHERE expires_at < NOW();
