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
  kind TEXT NOT NULL DEFAULT 'subscription' CHECK (kind IN ('subscription', 'featured', 'promoter')),
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
    OR
    (kind = 'promoter' AND requested_plan IS NULL AND internship_id IS NULL AND featured_days IS NULL)
  )
);

-- La app escucha estas tablas para activar beneficios y avisos sin recargar.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'plan_requests'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_requests';
    END IF;
  END IF;
END;
$$;

-- Compatibilidad si la tabla ya fue creada por una versión anterior.
ALTER TABLE public.plan_requests DROP CONSTRAINT IF EXISTS plan_requests_kind_check;
ALTER TABLE public.plan_requests ADD CONSTRAINT plan_requests_kind_check
  CHECK (kind IN ('subscription', 'featured', 'promoter'));
ALTER TABLE public.plan_requests DROP CONSTRAINT IF EXISTS plan_requests_check;
ALTER TABLE public.plan_requests ADD CONSTRAINT plan_requests_check CHECK (
  (kind = 'subscription' AND requested_plan IS NOT NULL AND internship_id IS NULL)
  OR (kind = 'featured' AND requested_plan IS NULL AND internship_id IS NOT NULL AND featured_days IS NOT NULL)
  OR (kind = 'promoter' AND requested_plan IS NULL AND internship_id IS NULL AND featured_days IS NULL)
);

ALTER TABLE public.plan_requests ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS plan_requests_pending_subscription_idx
  ON public.plan_requests(user_id) WHERE kind = 'subscription' AND status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS plan_requests_pending_featured_idx
  ON public.plan_requests(internship_id) WHERE kind = 'featured' AND status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS plan_requests_pending_promoter_idx
  ON public.plan_requests(user_id) WHERE kind = 'promoter' AND status = 'pending';
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
      OR (kind = 'promoter'
        AND public.auth_role() = 'estudiante'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.plan = 'pro'
            AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
        )
        AND NOT EXISTS (SELECT 1 FROM public.promoters WHERE profile_id = auth.uid())
      )
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

-- Registro durable de postulaciones iniciadas: retirar una postulación no recupera el cupo mensual.
CREATE TABLE IF NOT EXISTS public.student_application_usage (
  application_id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_application_usage ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS student_application_usage_month_idx
  ON public.student_application_usage(student_id, created_at);
INSERT INTO public.student_application_usage(application_id, student_id, created_at)
SELECT id, student_id, created_at FROM public.applications
ON CONFLICT (application_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.enforce_student_monthly_application_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  IF public.current_plan(NEW.student_id) = 'free' THEN
    SELECT count(*) INTO v_count
    FROM public.student_application_usage
    WHERE student_id = NEW.student_id
      AND created_at >= date_trunc('month', now());
    IF v_count >= 5 THEN RAISE EXCEPTION 'FREE_STUDENT_MONTHLY_APPLICATION_LIMIT'; END IF;
  END IF;
  INSERT INTO public.student_application_usage(application_id, student_id, created_at)
  VALUES (NEW.id, NEW.student_id, COALESCE(NEW.created_at, now()));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS applications_freemium_limit ON public.applications;
CREATE TRIGGER applications_freemium_limit BEFORE INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_student_monthly_application_limit();

-- Empresa Gratis puede revisar y gestionar los primeros 10 postulados de cada pasantía.
CREATE OR REPLACE FUNCTION public.company_can_view_application(
  p_application_id UUID, p_internship_id UUID
) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.internships i
    WHERE i.id = p_internship_id AND i.company_id = auth.uid()
      AND (
        public.current_plan(auth.uid()) IN ('pro', 'enterprise')
        OR p_application_id IN (
          SELECT a.id FROM public.applications a
          WHERE a.internship_id = p_internship_id
          ORDER BY a.created_at ASC, a.id ASC
          LIMIT 10
        )
      )
  );
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

-- Candidatos: el estudiante conserva acceso propio; Empresa Gratis ve 10 por pasantía y Pro ve todos.
DROP POLICY IF EXISTS applications_select ON public.applications;
DROP POLICY IF EXISTS applications_select_student ON public.applications;
DROP POLICY IF EXISTS applications_select_company ON public.applications;
DROP POLICY IF EXISTS applications_select_freemium ON public.applications;
CREATE POLICY applications_select_freemium ON public.applications
  FOR SELECT USING (
    student_id = auth.uid()
    OR public.company_can_view_application(id, internship_id)
  );
DROP POLICY IF EXISTS applications_update ON public.applications;
DROP POLICY IF EXISTS applications_update_company ON public.applications;
DROP POLICY IF EXISTS applications_update_freemium ON public.applications;
CREATE POLICY applications_update_freemium ON public.applications
  FOR UPDATE USING (
    public.company_can_view_application(id, internship_id)
  ) WITH CHECK (
    public.company_can_view_application(id, internship_id)
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
    WHERE requester_id = auth.uid()
      AND created_at >= GREATEST(
        date_trunc('month', now()),
        TIMESTAMPTZ '2026-08-24 00:09:25-03'
      );
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

CREATE OR REPLACE FUNCTION public.admin_list_users_with_plans()
RETURNS TABLE (
  id UUID,
  role TEXT,
  full_name TEXT,
  email TEXT,
  plan TEXT,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.role::TEXT, p.full_name, p.email, public.current_plan(p.id), p.plan_expires_at, p.created_at
  FROM public.profiles p
  WHERE public.is_admin()
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(p_user_id UUID, p_plan TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_email TEXT;
  v_base TEXT;
  v_code TEXT;
  v_event_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  IF p_plan NOT IN ('free', 'pro', 'enterprise') THEN RAISE EXCEPTION 'plan inválido'; END IF;

  SELECT role::TEXT, full_name, email INTO v_role, v_name, v_email
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'perfil inexistente'; END IF;
  IF p_plan = 'enterprise' AND v_role <> 'empresa' THEN
    RAISE EXCEPTION 'enterprise solo está disponible para empresas';
  END IF;

  UPDATE public.profiles
  SET plan = p_plan,
      plan_expires_at = CASE WHEN p_plan = 'free' THEN NULL ELSE now() + interval '30 days' END
  WHERE id = p_user_id;

  IF v_role = 'estudiante' AND p_plan = 'pro' THEN
    IF NOT EXISTS (SELECT 1 FROM public.promoters WHERE profile_id = p_user_id) THEN
      v_base := left(regexp_replace(lower(COALESCE(v_name, 'promotor')), '[^a-z0-9]+', '', 'g'), 12);
      IF v_base = '' THEN v_base := 'promotor'; END IF;
      v_code := v_base || substr(md5(p_user_id::TEXT), 1, 8);
      INSERT INTO public.promoters(code, profile_id, nombre, email)
      VALUES (v_code, p_user_id, v_name, v_email);
    END IF;
  ELSIF v_role = 'estudiante' AND p_plan = 'free' THEN
    DELETE FROM public.promoters WHERE profile_id = p_user_id;
  END IF;

  UPDATE public.plan_requests
  SET status = 'rejected', resolved_at = now(), admin_note = 'Reemplazada por cambio manual del admin'
  WHERE user_id = p_user_id AND kind = 'subscription' AND status = 'pending';

  IF p_plan <> 'free' THEN
    INSERT INTO public.plan_requests(
      user_id, requested_plan, kind, message, status, admin_note, resolved_at
    ) VALUES (
      p_user_id, p_plan, 'subscription', 'Cambio manual desde Administración',
      'approved', 'Asignado manualmente por el admin', now()
    ) RETURNING id INTO v_event_id;
  END IF;

  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users_with_plans() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_plan(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users_with_plans() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_plan(UUID, TEXT) TO authenticated;

-- Compatibilidad: bloquea altas manuales nuevas que no sean de Estudiante Pro.
-- Los promotores ya existentes se conservan y pueden mantener su código.
CREATE OR REPLACE FUNCTION public.admin_assign_promoter(p_profile_id UUID, p_code TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_name TEXT;
  v_email TEXT;
  v_role TEXT;
  v_exists BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  v_code := lower(trim(p_code));
  IF v_code = '' THEN RAISE EXCEPTION 'codigo vacio'; END IF;
  SELECT full_name, email, role::TEXT INTO v_name, v_email, v_role
  FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'perfil inexistente'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.promoters WHERE profile_id = p_profile_id) INTO v_exists;
  IF NOT v_exists AND (v_role <> 'estudiante' OR public.current_plan(p_profile_id) <> 'pro') THEN
    RAISE EXCEPTION 'PROMOTER_REQUIRES_STUDENT_PRO';
  END IF;
  DELETE FROM public.promoters WHERE profile_id = p_profile_id AND code <> v_code;
  INSERT INTO public.promoters(code, profile_id, nombre, email)
  VALUES (v_code, p_profile_id, v_name, v_email)
  ON CONFLICT (code) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resolve_plan_request(
  p_request_id UUID, p_approve BOOLEAN, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.plan_requests%ROWTYPE;
  v_name TEXT;
  v_email TEXT;
  v_role TEXT;
  v_base TEXT;
  v_code TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO r FROM public.plan_requests WHERE id = p_request_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF p_approve AND r.kind = 'subscription' THEN
    UPDATE public.profiles SET plan = r.requested_plan, plan_expires_at = now() + interval '30 days'
    WHERE id = r.user_id;
    SELECT full_name, email, role::TEXT INTO v_name, v_email, v_role
    FROM public.profiles WHERE id = r.user_id;
    IF r.requested_plan = 'pro' AND v_role = 'estudiante'
      AND NOT EXISTS (SELECT 1 FROM public.promoters WHERE profile_id = r.user_id) THEN
      v_base := left(regexp_replace(lower(COALESCE(v_name, 'promotor')), '[^a-z0-9]+', '', 'g'), 12);
      IF v_base = '' THEN v_base := 'promotor'; END IF;
      v_code := v_base || substr(md5(r.user_id::text), 1, 8);
      INSERT INTO public.promoters(code, profile_id, nombre, email)
      VALUES (v_code, r.user_id, v_name, v_email);
    END IF;
    IF r.requested_plan = 'pro' AND v_role = 'estudiante' THEN
      UPDATE public.plan_requests
      SET status = 'approved', resolved_at = now(), admin_note = 'Incluido con Estudiante Pro'
      WHERE user_id = r.user_id AND kind = 'promoter' AND status = 'pending';
    END IF;
  ELSIF p_approve AND r.kind = 'featured' THEN
    UPDATE public.internships SET featured_until = now() + make_interval(days => r.featured_days)
    WHERE id = r.internship_id;
  ELSIF p_approve AND r.kind = 'promoter' THEN
    IF public.current_plan(r.user_id) <> 'pro' THEN
      RAISE EXCEPTION 'PROMOTER_REQUIRES_STUDENT_PRO';
    END IF;
    SELECT full_name, email INTO v_name, v_email
    FROM public.profiles WHERE id = r.user_id AND role = 'estudiante';
    IF NOT FOUND THEN RAISE EXCEPTION 'student not found'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.promoters WHERE profile_id = r.user_id) THEN
      v_base := left(regexp_replace(lower(COALESCE(v_name, 'promotor')), '[^a-z0-9]+', '', 'g'), 12);
      IF v_base = '' THEN v_base := 'promotor'; END IF;
      v_code := v_base || substr(md5(r.user_id::text), 1, 8);
      INSERT INTO public.promoters(code, profile_id, nombre, email)
      VALUES (v_code, r.user_id, v_name, v_email);
    END IF;
  END IF;
  UPDATE public.plan_requests SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    admin_note = p_note, resolved_at = now() WHERE id = p_request_id;
END;
$$;

-- Regulariza estudiantes que ya tenían Pro antes de que Promotor fuera automático.
INSERT INTO public.promoters(code, profile_id, nombre, email)
SELECT
  left(COALESCE(NULLIF(regexp_replace(lower(p.full_name), '[^a-z0-9]+', '', 'g'), ''), 'promotor'), 12)
    || substr(md5(p.id::TEXT), 1, 8),
  p.id,
  p.full_name,
  p.email
FROM public.profiles p
WHERE p.role = 'estudiante'
  AND public.current_plan(p.id) = 'pro'
  AND NOT EXISTS (SELECT 1 FROM public.promoters promoter WHERE promoter.profile_id = p.id)
ON CONFLICT DO NOTHING;

UPDATE public.plan_requests request
SET status = 'approved', resolved_at = COALESCE(request.resolved_at, now()), admin_note = 'Incluido con Estudiante Pro'
WHERE request.kind = 'promoter'
  AND request.status = 'pending'
  AND EXISTS (SELECT 1 FROM public.promoters promoter WHERE promoter.profile_id = request.user_id);

GRANT EXECUTE ON FUNCTION public.current_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_can_view_application(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_plan_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_plan_request(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_promoter(UUID, TEXT) TO authenticated;