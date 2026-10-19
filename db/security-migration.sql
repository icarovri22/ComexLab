-- Migration applied with Neon migration workflow, preserving existing users.
ALTER TABLE public.comexlab_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.comexlab_users ADD COLUMN IF NOT EXISTS recovery_code_hash TEXT;
CREATE TABLE IF NOT EXISTS public.comexlab_mfa (
  user_id BIGINT PRIMARY KEY REFERENCES public.comexlab_users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  pending_until TIMESTAMPTZ,
  last_used_step BIGINT NOT NULL DEFAULT -1
);
CREATE TABLE IF NOT EXISTS public.comexlab_mfa_backup_codes (
  user_id BIGINT NOT NULL REFERENCES public.comexlab_users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  PRIMARY KEY(user_id,code_hash)
);
CREATE INDEX IF NOT EXISTS comexlab_mfa_backup_user_idx ON public.comexlab_mfa_backup_codes(user_id);
