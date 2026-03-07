-- 005: Reviews upgrade — images, helpful votes, review_votes table

-- Add missing columns to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_yes INT DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_no INT DEFAULT 0;

-- Review Votes table
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

-- RLS for review_votes
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY review_votes_public_read ON public.review_votes
  FOR SELECT USING (TRUE);

CREATE POLICY review_votes_user_insert ON public.review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY review_votes_user_update ON public.review_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY review_votes_admin_all ON public.review_votes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
