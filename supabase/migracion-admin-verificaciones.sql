-- =============================================================================
-- MIGRACIÓN: Administración de verificaciones de perfiles
-- Ejecutar en Supabase SQL Editor después de migracion-verificacion.sql y
-- migracion-admin.sql.
-- =============================================================================

-- Ya no existen solicitudes de verificación iniciadas por usuarios.
DROP FUNCTION IF EXISTS public.request_profile_verification();
ALTER TABLE student_profiles DROP COLUMN IF EXISTS verification_requested;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS verification_requested;
ALTER TABLE ambassador_profiles DROP COLUMN IF EXISTS verification_requested;

-- Impide autoasignarse el tilde. Admin y tareas internas conservan la capacidad
-- de administrar verificaciones.
CREATE OR REPLACE FUNCTION public.guard_profile_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'solo un administrador puede cambiar la verificación';
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

DROP FUNCTION IF EXISTS public.admin_list_verifications();
CREATE FUNCTION public.admin_list_verifications()
RETURNS TABLE (
  id uuid,
  role user_role,
  full_name text,
  display_name text,
  email text,
  detail text,
  avatar_url text,
  verified boolean
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
      COALESCE(c.company_name, p.full_name, p.email) AS display_name,
      p.email,
      c.industry AS detail,
      c.avatar_url AS avatar_url,
      COALESCE(c.verified, false) AS verified
    FROM profiles p
    JOIN company_profiles c ON c.id = p.id
    WHERE p.role = 'empresa'
    ORDER BY p.created_at DESC;
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

  IF v_role = 'empresa' THEN
    UPDATE company_profiles
      SET verified = p_verified
      WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'solo se pueden verificar empresas';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_verifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_profile_verification(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_verification(uuid, boolean) TO authenticated;
