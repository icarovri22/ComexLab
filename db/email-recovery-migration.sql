-- Run as an additive migration through Neon. Does not change existing accounts.
CREATE TABLE IF NOT EXISTS public.comexlab_email_reset_tokens (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES public.comexlab_users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comexlab_reset_token_user_idx ON public.comexlab_email_reset_tokens(user_id,created_at DESC);
