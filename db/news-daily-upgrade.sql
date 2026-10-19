-- Keep the MDIC news feed aligned with the allowlisted server configuration.
UPDATE public.comexlab_news_sources SET name='MDIC — Notícias',feed_url='https://www.gov.br/mdic/pt-br/assuntos/noticias/RSS',website_url='https://www.gov.br/mdic/pt-br/assuntos/noticias',updated_at=NOW() WHERE slug='mdic';
