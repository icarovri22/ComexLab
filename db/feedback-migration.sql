-- ComexHub 1.4: user opinions and account-scoped daily Security notice.
-- Apply through Neon migration workflow; verified on temporary branch first.
ALTER TABLE public.comexlab_users ADD COLUMN IF NOT EXISTS security_reminder_seen_on DATE;
CREATE TABLE IF NOT EXISTS public.comexlab_feedback (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES public.comexlab_users(id) ON DELETE CASCADE,
 rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
 suggestion TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 reviewed_at TIMESTAMPTZ,
 reviewed_by BIGINT REFERENCES public.comexlab_users(id) ON DELETE SET NULL,
 CONSTRAINT comexlab_feedback_content CHECK (rating IS NOT NULL OR length(btrim(suggestion)) > 0),
 CONSTRAINT comexlab_feedback_suggestion_length CHECK (length(suggestion) <= 1500)
);
CREATE INDEX IF NOT EXISTS comexlab_feedback_user_created_idx ON public.comexlab_feedback(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS comexlab_feedback_status_created_idx ON public.comexlab_feedback(status,created_at DESC);
