-- =============================================================================
-- MIGRACIÓN: Administración de verificaciones de perfiles
-- Ejecutar en Supabase SQL Editor después de migracion-verificacion.sql y
-- migracion-admin.sql.
-- =============================================================================

-- La solicitud se crea dentro de la plataforma, sin correo. La función valida
-- el plan en la base para que el requisito Pro no dependa solo de la interfaz.
CREATE OR REPLACE FUNCTION public.request_profile_verification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role user_role;
  v_plan text;
  v_plan_expires_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  SELECT role, plan::text, plan_expires_at
    INTO v_role, v_plan, v_plan_expires_at
    FROM profiles
    WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil inexistente';
  END IF;

  IF v_plan NOT IN ('pro', 'enterprise')
    OR (v_plan_expires_at IS NOT NULL AND v_plan_expires_at < now()) THEN
    RAISE EXCEPTION 'PLAN_PRO_REQUIRED';
  END IF;

  IF v_role = 'estudiante' THEN
    UPDATE student_profiles SET verification_requested = true WHERE id = v_user_id;
  ELSIF v_role = 'empresa' THEN
    UPDATE company_profiles SET verification_requested = true WHERE id = v_user_id;
  ELSIF v_role = 'embajador' THEN
    UPDATE ambassador_profiles SET verification_requested = true WHERE id = v_user_id;
  ELSE
    RAISE EXCEPTION 'rol no verificable';
  END IF;
END;
$$;

-- Impide autoasignarse el tilde y bloquea solicitudes sin Pro incluso si se
-- intenta actualizar la tabla directamente. Admin y tareas internas conservan
-- la capacidad de resolver verificaciones.
CREATE OR REPLACE FUNCTION public.guard_profile_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_plan_expires_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'solo un administrador puede cambiar la verificación';
  END IF;

  IF NEW.verification_requested IS TRUE
    AND NEW.verification_requested IS DISTINCT FROM OLD.verification_requested THEN
    SELECT plan::text, plan_expires_at
      INTO v_plan, v_plan_expires_at
      FROM profiles
      WHERE id = auth.uid();

    IF NEW.id <> auth.uid()
      OR v_plan NOT IN ('pro', 'enterprise')
      OR (v_plan_expires_at IS NOT NULL AND v_plan_expires_at < now()) THEN
      RAISE EXCEPTION 'PLAN_PRO_REQUIRED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_student_profile_verification ON student_profiles;
CREATE TRIGGER guard_student_profile_verification
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification_fields();

DROP TRIGGER IF EXISTS guard_company_profile_verification ON company_profiles;
CREATE TRIGGER guard_company_profile_verification
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification_fields();

DROP TRIGGER IF EXISTS guard_ambassador_profile_verification ON ambassador_profiles;
CREATE TRIGGER guard_ambassador_profile_verification
  BEFORE UPDATE ON ambassador_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification_fields();

CREATE OR REPLACE FUNCTION public.admin_list_verifications()
RETURNS TABLE (
  id uuid,
  role user_role,
  full_name text,
  display_name text,
  email text,
  detail text,
  avatar_url text,
  verified boolean,
  verification_requested boolean
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      p.role,
      p.full_name,
      CASE
        WHEN p.role = 'empresa' THEN COALESCE(c.company_name, p.full_name, p.email)
        WHEN p.role = 'embajador' THEN COALESCE(a.org_name, p.full_name, p.email)
        ELSE COALESCE(p.full_name, p.email)
      END AS display_name,
      p.email,
      CASE
        WHEN p.role = 'empresa' THEN c.industry
        WHEN p.role = 'embajador' THEN a.university
        ELSE s.university
      END AS detail,
      CASE
        WHEN p.role = 'empresa' THEN c.avatar_url
        WHEN p.role = 'embajador' THEN a.logo_url
        ELSE s.avatar_url
      END AS avatar_url,
      CASE
        WHEN p.role = 'empresa' THEN COALESCE(c.verified, false)
        WHEN p.role = 'embajador' THEN COALESCE(a.verified, false)
        ELSE COALESCE(s.verified, false)
      END AS verified,
      CASE
        WHEN p.role = 'empresa' THEN COALESCE(c.verification_requested, false)
        WHEN p.role = 'embajador' THEN COALESCE(a.verification_requested, false)
        ELSE COALESCE(s.verification_requested, false)
      END AS verification_requested
    FROM profiles p
    LEFT JOIN student_profiles s ON s.id = p.id
    LEFT JOIN company_profiles c ON c.id = p.id
    LEFT JOIN ambassador_profiles a ON a.id = p.id
    WHERE p.role IN ('estudiante', 'empresa', 'embajador')
    ORDER BY
      CASE
        WHEN COALESCE(s.verification_requested, c.verification_requested, a.verification_requested, false)
          AND NOT COALESCE(s.verified, c.verified, a.verified, false)
        THEN 0
        ELSE 1
      END,
      p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_profile_verification(
  p_user_id uuid,
  p_verified boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil inexistente';
  END IF;

  IF v_role = 'estudiante' THEN
    UPDATE student_profiles
      SET verified = p_verified, verification_requested = false
      WHERE id = p_user_id;
  ELSIF v_role = 'empresa' THEN
    UPDATE company_profiles
      SET verified = p_verified, verification_requested = false
      WHERE id = p_user_id;
  ELSIF v_role = 'embajador' THEN
    UPDATE ambassador_profiles
      SET verified = p_verified, verification_requested = false
      WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'rol no verificable';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_verifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_profile_verification(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_profile_verification() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_verification(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_profile_verification() TO authenticated;