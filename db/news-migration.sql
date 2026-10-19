CREATE TABLE IF NOT EXISTS public.comexlab_news_sources (
 slug TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 feed_url TEXT NOT NULL,
 website_url TEXT NOT NULL,
 is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 last_checked_at TIMESTAMPTZ,
 last_success_at TIMESTAMPTZ,
 last_error TEXT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.comexlab_news (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_slug TEXT REFERENCES public.comexlab_news_sources(slug) ON DELETE SET NULL,
 source_name TEXT NOT NULL,
 source_url TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL CHECK (length(title) BETWEEN 6 AND 240),
 summary TEXT NOT NULL DEFAULT '' CHECK (length(summary) <= 700),
 impact TEXT NOT NULL DEFAULT '' CHECK (length(impact) <= 1000),
 category TEXT NOT NULL DEFAULT 'geral' CHECK (category IN ('geral','tarifas','logistica','acordos','economia','regulamentacao','riscos')),
 countries TEXT[] NOT NULL DEFAULT '{}',
 published_at TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','hidden')),
 featured BOOLEAN NOT NULL DEFAULT FALSE,
 is_manual BOOLEAN NOT NULL DEFAULT FALSE,
 created_by BIGINT REFERENCES public.comexlab_users(id) ON DELETE SET NULL,
 updated_by BIGINT REFERENCES public.comexlab_users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comexlab_news_public_idx ON public.comexlab_news(status,published_at DESC);
CREATE INDEX IF NOT EXISTS comexlab_news_category_idx ON public.comexlab_news(category,status);
CREATE INDEX IF NOT EXISTS comexlab_news_countries_idx ON public.comexlab_news USING GIN(countries);
CREATE TABLE IF NOT EXISTS public.comexlab_news_sync_runs (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 completed_at TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','ok','partial','error')),
 sources_checked INTEGER NOT NULL DEFAULT 0,
 items_added INTEGER NOT NULL DEFAULT 0,
 details TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS public.comexlab_news_sync_lock (
 id INTEGER PRIMARY KEY CHECK(id=1),
 leased_until TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.comexlab_news_sync_lock(id) VALUES(1) ON CONFLICT DO NOTHING;
INSERT INTO public.comexlab_news_sources(slug,name,feed_url,website_url)
VALUES
('mdic','MDIC — Balança Comercial','https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/informativos/RSS','https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/informativos'),
('wto','OMC — Notícias','https://www.wto.org/library/rss/latest_news_e.xml','https://www.wto.org/'),
('ec','Comissão Europeia — Comércio','https://policy.trade.ec.europa.eu/node/2/rss_en','https://policy.trade.ec.europa.eu/news_en')
ON CONFLICT(slug) DO NOTHING;
