-- =============================================================================
-- MIGRACION: actividad privada de postulaciones para administradores
-- Ejecutar en el SQL Editor de Supabase despues de migracion-admin.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_application_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('application_created', 'status_changed')),
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_application_activity_created_idx
  ON public.admin_application_activity(created_at DESC);

ALTER TABLE public.admin_application_activity ENABLE ROW LEVEL SECURITY;

-- No se crean politicas: ningun usuario puede consultar esta tabla directamente.
-- La lectura se realiza exclusivamente mediante la RPC protegida de abajo.

CREATE OR REPLACE FUNCTION public.log_admin_application_activity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_application_activity (
      application_id, event_type, new_status
    ) VALUES (
      NEW.id, 'application_created', NEW.status::TEXT
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status
    AND NEW.status::TEXT IN ('entrevista', 'seleccionado') THEN
    INSERT INTO public.admin_application_activity (
      application_id, event_type, previous_status, new_status
    ) VALUES (
      NEW.id, 'status_changed', OLD.status::TEXT, NEW.status::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_admin_activity ON public.applications;
CREATE TRIGGER applications_admin_activity
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.log_admin_application_activity();

CREATE OR REPLACE FUNCTION public.admin_list_application_activity(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  application_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  internship_id UUID,
  internship_title TEXT,
  company_id UUID,
  company_name TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  RETURN QUERY
    SELECT
      activity.id,
      activity.event_type,
      application.id,
      application.student_id,
      COALESCE(student.full_name, 'Estudiante'),
      COALESCE(student.email, ''),
      internship.id,
      COALESCE(internship.title, 'Pasantia eliminada'),
      internship.company_id,
      COALESCE(company.company_name, company_profile.full_name, internship.company_name, 'Empresa'),
      activity.previous_status,
      activity.new_status,
      activity.created_at
    FROM public.admin_application_activity activity
    JOIN public.applications application ON application.id = activity.application_id
    LEFT JOIN public.profiles student ON student.id = application.student_id
    LEFT JOIN public.internships internship ON internship.id = application.internship_id
    LEFT JOIN public.company_profiles company ON company.id = internship.company_id
    LEFT JOIN public.profiles company_profile ON company_profile.id = internship.company_id
    ORDER BY activity.created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$$;

REVOKE ALL ON TABLE public.admin_application_activity FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_application_activity FROM anon;
REVOKE ALL ON TABLE public.admin_application_activity FROM authenticated;
REVOKE ALL ON FUNCTION public.log_admin_application_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_application_activity(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_application_activity(INTEGER) TO authenticated;

-- Registra las postulaciones existentes para que la pestaña no empiece vacia.
INSERT INTO public.admin_application_activity (
  application_id, event_type, new_status, created_at
)
SELECT application.id, 'application_created', application.status::TEXT, application.created_at
FROM public.applications application
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_application_activity activity
  WHERE activity.application_id = application.id
    AND activity.event_type = 'application_created'
);