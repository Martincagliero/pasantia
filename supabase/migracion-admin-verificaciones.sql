-- =============================================================================
-- MIGRACIÓN: Administración de verificaciones de perfiles
-- Ejecutar en Supabase SQL Editor después de migracion-verificacion.sql y
-- migracion-admin.sql.
-- =============================================================================

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

GRANT EXECUTE ON FUNCTION public.admin_list_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_verification(uuid, boolean) TO authenticated;