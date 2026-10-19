-- ComexHub 1.7.1: conteúdos multilíngues, preservando integralmente a notícia original.
ALTER TABLE public.comexlab_news
 ADD COLUMN IF NOT EXISTS title_pt TEXT,
 ADD COLUMN IF NOT EXISTS summary_pt TEXT,
 ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT 'pending' CHECK (translation_status IN ('pending','ready')),
 ADD COLUMN IF NOT EXISTS translation_provider TEXT,
 ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ,
 ADD COLUMN IF NOT EXISTS translation_attempted_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS public.comexlab_news_translation_quota (
 quota_day DATE PRIMARY KEY,
 chars_used INTEGER NOT NULL DEFAULT 0 CHECK(chars_used>=0)
);
CREATE INDEX IF NOT EXISTS comexlab_news_translation_status_idx
 ON public.comexlab_news(translation_status, published_at DESC);
UPDATE public.comexlab_news
 SET title_pt=title, summary_pt=summary, translation_status='ready',translation_provider='original-pt', translated_at=NOW()
 WHERE source_slug='mdic' AND translation_status='pending';
UPDATE public.comexlab_news
 SET title_pt=title, summary_pt=summary, translation_status='ready',translation_provider='manual-pt', translated_at=NOW()
 WHERE is_manual=true AND translation_status='pending';
