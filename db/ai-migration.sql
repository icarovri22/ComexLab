-- ComexHub IA 1.8.6 — migration additive; execute once on Neon production.
-- No historical records are changed.
CREATE TABLE IF NOT EXISTS comexlab_ai_questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES comexlab_users(id) ON DELETE CASCADE,
  day_utc DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::date,
  daily_slot SMALLINT NOT NULL CHECK (daily_slot BETWEEN 1 AND 30),
  prompt TEXT NOT NULL CHECK (char_length(prompt) <= 1800),
  answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete')),
  rating TEXT CHECK (rating IN ('up','down')),
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, day_utc, daily_slot)
);
CREATE INDEX IF NOT EXISTS comexlab_ai_questions_user_recent ON comexlab_ai_questions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comexlab_ai_questions_stats ON comexlab_ai_questions(day_utc, status);
