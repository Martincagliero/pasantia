-- PasantIA Freemium: planes, solicitudes, destacados y limites reales en DB.
-- Ejecutar una vez en Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.plan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_plan TEXT CHECK (requested_plan IN ('pro', 'enterprise')),
  kind TEXT NOT NULL DEFAULT 'subscription' CHECK (kind IN ('subscription', 'featured')),
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
  featured_days INTEGER CHECK (featured_days IN (15, 30)),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CHECK (
    (kind = 'subscription' AND requested_plan IS NOT NULL AND internship_id IS NULL)
    OR
    (kind = 'featured' AND requested_plan IS NULL AND internship_id IS NOT NULL AND featured_days IS NOT NULL)
  )
);

ALTER TABLE public.plan_requests ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS plan_requests_pending_subscription_idx
  ON public.plan_requests(user_id) WHERE kind = 'subscription' AND status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS plan_requests_pending_featured_idx
  ON public.plan_requests(internship_id) WHERE kind = 'featured' AND status = 'pending';
DROP POLICY IF EXISTS plan_requests_select_own ON public.plan_requests;
CREATE POLICY plan_requests_select_own ON public.plan_requests
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS plan_requests_insert_own ON public.plan_requests;
CREATE POLICY plan_requests_insert_own ON public.plan_requests
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND status = 'pending' AND (
      (kind = 'subscription' AND (
        requested_plan = 'pro'
        OR (requested_plan = 'enterprise' AND public.auth_role() = 'empresa')
      ))
      OR (kind = 'featured' AND public.auth_role() = 'empresa' AND EXISTS (
        SELECT 1 FROM public.internships i
        WHERE i.id = internship_id AND i.company_id = auth.uid()
      ))
    )
  );

CREATE OR REPLACE FUNCTION public.current_plan(p_user UUID DEFAULT auth.uid())
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN p.plan IN ('pro', 'enterprise')
      AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now()) THEN p.plan
    ELSE 'free'
  END
  FROM public.profiles p WHERE p.id = p_user;
$$;

-- Gratis empresa: hasta 3 publicaciones creadas dentro del mes calendario.
CREATE OR REPLACE FUNCTION public.enforce_company_monthly_post_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role TEXT; v_count INTEGER;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = NEW.company_id;
  IF v_role = 'empresa' AND public.current_plan(NEW.company_id) = 'free' THEN
    SELECT count(*) INTO v_count FROM public.internships
    WHERE company_id = NEW.company_id
      AND created_at >= date_trunc('month', now());
    IF v_count >= 3 THEN
      RAISE EXCEPTION 'FREE_COMPANY_MONTHLY_LIMIT';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS internships_freemium_limit ON public.internships;
CREATE TRIGGER internships_freemium_limit BEFORE INSERT ON public.internships
FOR EACH ROW EXECUTE FUNCTION public.enforce_company_monthly_post_limit();

-- Candidatos: el estudiante conserva acceso propio; solo empresas pagas acceden a los recibidos.
DROP POLICY IF EXISTS applications_select ON public.applications;
DROP POLICY IF EXISTS applications_select_student ON public.applications;
DROP POLICY IF EXISTS applications_select_company ON public.applications;
DROP POLICY IF EXISTS applications_select_freemium ON public.applications;
CREATE POLICY applications_select_freemium ON public.applications
  FOR SELECT USING (
    student_id = auth.uid()
    OR (
      public.current_plan(auth.uid()) IN ('pro', 'enterprise')
      AND EXISTS (
        SELECT 1 FROM public.internships i
        WHERE i.id = internship_id AND i.company_id = auth.uid()
      )
    )
  );
DROP POLICY IF EXISTS applications_update ON public.applications;
DROP POLICY IF EXISTS applications_update_company ON public.applications;
DROP POLICY IF EXISTS applications_update_freemium ON public.applications;
CREATE POLICY applications_update_freemium ON public.applications
  FOR UPDATE USING (
    public.current_plan(auth.uid()) IN ('pro', 'enterprise')
    AND EXISTS (
      SELECT 1 FROM public.internships i
      WHERE i.id = internship_id AND i.company_id = auth.uid()
    )
  ) WITH CHECK (
    public.current_plan(auth.uid()) IN ('pro', 'enterprise')
    AND EXISTS (
      SELECT 1 FROM public.internships i
      WHERE i.id = internship_id AND i.company_id = auth.uid()
    )
  );

-- Gratis estudiante: hasta 5 solicitudes nuevas por mes.
CREATE OR REPLACE FUNCTION public.request_connection(p_recipient_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR p_recipient_id = auth.uid()
    OR public.auth_role() <> 'estudiante'
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND role = 'estudiante') THEN
    RAISE EXCEPTION 'CONNECTION_NOT_ALLOWED';
  END IF;
  SELECT id INTO v_id FROM public.connection_requests
  WHERE LEAST(requester_id, recipient_id) = LEAST(auth.uid(), p_recipient_id)
    AND GREATEST(requester_id, recipient_id) = GREATEST(auth.uid(), p_recipient_id)
    AND status IN ('pending', 'accepted')
  LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  IF public.current_plan(auth.uid()) = 'free' THEN
    SELECT count(*) INTO v_count FROM public.connection_requests
    WHERE requester_id = auth.uid() AND created_at >= date_trunc('month', now());
    IF v_count >= 5 THEN RAISE EXCEPTION 'FREE_CONNECTION_MONTHLY_LIMIT'; END IF;
  END IF;
  INSERT INTO public.connection_requests(requester_id, recipient_id)
  VALUES (auth.uid(), p_recipient_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_message(p_sender UUID, p_recipient UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_sender = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles sender
    WHERE sender.id = p_sender AND (
      sender.role = 'embajador'
      OR public.current_plan(p_sender) IN ('pro', 'enterprise')
      OR EXISTS (
        SELECT 1 FROM public.messages m
        WHERE (m.sender_id = p_sender AND m.recipient_id = p_recipient)
           OR (m.sender_id = p_recipient AND m.recipient_id = p_sender)
      )
      OR (sender.role = 'estudiante' AND EXISTS (
        SELECT 1 FROM public.follows f1
        JOIN public.follows f2 ON f2.follower_id = f1.following_id AND f2.following_id = f1.follower_id
        WHERE f1.follower_id = p_sender AND f1.following_id = p_recipient
      ))
    )
  );
$$;

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
DROP POLICY IF EXISTS messages_insert_freemium ON public.messages;
CREATE POLICY messages_insert_freemium ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND public.can_message(sender_id, recipient_id));

CREATE OR REPLACE FUNCTION public.admin_list_plan_requests()
RETURNS TABLE (
  id UUID, user_id UUID, full_name TEXT, email TEXT, role TEXT, current_plan TEXT,
  requested_plan TEXT, kind TEXT, internship_id UUID, internship_title TEXT,
  featured_days INTEGER, message TEXT, status TEXT, created_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.user_id, p.full_name, p.email, p.role, public.current_plan(p.id),
    r.requested_plan, r.kind, r.internship_id, i.title, r.featured_days,
    r.message, r.status, r.created_at
  FROM public.plan_requests r
  JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN public.internships i ON i.id = r.internship_id
  WHERE public.is_admin()
  ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_resolve_plan_request(
  p_request_id UUID, p_approve BOOLEAN, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.plan_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO r FROM public.plan_requests WHERE id = p_request_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF p_approve AND r.kind = 'subscription' THEN
    UPDATE public.profiles SET plan = r.requested_plan, plan_expires_at = now() + interval '30 days'
    WHERE id = r.user_id;
  ELSIF p_approve AND r.kind = 'featured' THEN
    UPDATE public.internships SET featured_until = now() + make_interval(days => r.featured_days)
    WHERE id = r.internship_id;
  END IF;
  UPDATE public.plan_requests SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    admin_note = p_note, resolved_at = now() WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_plan_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_plan_request(UUID, BOOLEAN, TEXT) TO authenticated;