-- ComexHub account tables. Review and apply through Neon migration workflow.
-- This file has NOT been applied to production.
CREATE TABLE IF NOT EXISTS comexlab_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT, -- Nullable only for previously registered accounts.
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT comexlab_username_valid CHECK (username ~ '^[a-z0-9._-]{3,24}$')
);

CREATE TABLE IF NOT EXISTS comexlab_login_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comexlab_login_attempts_lookup
  ON comexlab_login_attempts(username, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS comexlab_users_email_unique ON comexlab_users (LOWER(email)) WHERE email IS NOT NULL;
-- E-mail obrigatório é validado pela API em novas contas, não para contas legadas.
