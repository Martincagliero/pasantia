-- La verificacion identifica exclusivamente empresas revisadas por PasantIA.
-- Los planes Gratis/Pro/Empresa son independientes de este estado.

UPDATE public.student_profiles SET verified = false WHERE verified = true;
UPDATE public.ambassador_profiles SET verified = false WHERE verified = true;

-- Las comunidades dejan de depender de un tilde para aparecer en directorios.
DROP POLICY IF EXISTS "ambassador_profiles_select_verified" ON public.ambassador_profiles;
DROP POLICY IF EXISTS "amb_select_all" ON public.ambassador_profiles;
CREATE POLICY "amb_select_all" ON public.ambassador_profiles
  FOR SELECT USING (true);

-- Sus anuncios tampoco requieren verificacion.
DO $$
BEGIN
  IF to_regclass('public.ambassador_posts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Público ve posts verificados" ON public.ambassador_posts;
    DROP POLICY IF EXISTS "posts_select_verified_ambassadors" ON public.ambassador_posts;
    DROP POLICY IF EXISTS "Público ve posts de embajadores" ON public.ambassador_posts;
    CREATE POLICY "Público ve posts de embajadores" ON public.ambassador_posts
      FOR SELECT USING (true);
  END IF;
END;
$$;

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
    SELECT p.id, p.role, p.full_name,
      COALESCE(c.company_name, p.full_name, p.email),
      p.email, c.industry, c.avatar_url, COALESCE(c.verified, false)
    FROM public.profiles p
    JOIN public.company_profiles c ON c.id = p.id
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
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'empresa'
  ) THEN
    RAISE EXCEPTION 'solo se pueden verificar empresas';
  END IF;

  UPDATE public.company_profiles
  SET verified = p_verified
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_verifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_profile_verification(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_verification(uuid, boolean) TO authenticated;