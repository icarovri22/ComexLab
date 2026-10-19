-- Migração aditiva e compatível com contas existentes: a coluna é opcional
-- para usuários criados antes da introdução do e-mail no cadastro.
ALTER TABLE public.comexlab_users
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS comexlab_users_email_unique
  ON public.comexlab_users (LOWER(email)) WHERE email IS NOT NULL;

-- Valida novos endereços, mantendo as contas antigas sem e-mail.
ALTER TABLE public.comexlab_users
  ADD CONSTRAINT comexlab_users_email_format
  CHECK (email IS NULL OR (
    email = lower(btrim(email))
    AND char_length(email) BETWEEN 5 AND 254
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  ));
