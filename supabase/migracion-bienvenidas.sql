-- =============================================================================
-- PasantIA: bienvenida única entre usuarios nuevos.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profile_welcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_welcomes_not_self CHECK (sender_id <> recipient_id),
  CONSTRAINT profile_welcomes_unique UNIQUE (sender_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS profile_welcomes_recipient_created_idx
  ON public.profile_welcomes(recipient_id, created_at DESC);

ALTER TABLE public.profile_welcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_welcomes_select_involved" ON public.profile_welcomes;
CREATE POLICY "profile_welcomes_select_involved" ON public.profile_welcomes
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "profile_welcomes_insert_own" ON public.profile_welcomes;
CREATE POLICY "profile_welcomes_insert_own" ON public.profile_welcomes
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND recipient_id <> auth.uid());
