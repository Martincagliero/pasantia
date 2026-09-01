-- Registro idempotente de la campaña de email Estudiante Pro.
-- Ejecutar en Supabase SQL Editor antes de usar la pestaña Emails Pro.

CREATE TABLE IF NOT EXISTS public.plan_email_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  resend_id TEXT,
  sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign, user_id)
);

ALTER TABLE public.plan_email_campaign_sends ENABLE ROW LEVEL SECURITY;

-- No se crean políticas públicas: únicamente la Edge Function accede con service role.
REVOKE ALL ON public.plan_email_campaign_sends FROM anon, authenticated;
