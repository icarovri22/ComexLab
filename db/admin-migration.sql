-- ComexHub 1.0: additive administration migration (applied via Neon tool).
-- Existing users are not promoted automatically. Admin grants require owner confirmation.
ALTER TABLE public.comexlab_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.comexlab_users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.comexlab_users
  ADD CONSTRAINT comexlab_users_role_valid CHECK (role IN ('user','admin'));
CREATE TABLE IF NOT EXISTS public.comexlab_study_overrides (
  slug TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by BIGINT REFERENCES public.comexlab_users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS public.comexlab_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by BIGINT REFERENCES public.comexlab_users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS public.comexlab_admin_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id BIGINT REFERENCES public.comexlab_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comexlab_admin_audit_created_idx ON public.comexlab_admin_audit(created_at DESC);
INSERT INTO public.comexlab_settings(key,value) VALUES('announcement','') ON CONFLICT(key) DO NOTHING;
