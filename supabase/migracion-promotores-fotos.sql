-- Agrega la foto del estudiante al ranking público de promotores.
-- Ejecutar una vez en el SQL Editor de Supabase.

DROP FUNCTION IF EXISTS public.public_promoter_ranking();

CREATE FUNCTION public.public_promoter_ranking()
RETURNS TABLE (
  code        text,
  nombre      text,
  avatar_url  text,
  total       bigint,
  estudiantes bigint,
  empresas    bigint,
  comunidades bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    pr.code,
    COALESCE(NULLIF(pr.nombre, ''), pf.full_name, pr.code),
    sp.avatar_url,
    COUNT(ea.id)::bigint,
    COUNT(ea.id) FILTER (WHERE ea.rol = 'estudiante')::bigint,
    COUNT(ea.id) FILTER (WHERE ea.rol = 'empresa')::bigint,
    COUNT(ea.id) FILTER (WHERE ea.rol = 'embajador')::bigint
  FROM promoters pr
  LEFT JOIN profiles pf ON pf.id = pr.profile_id
  LEFT JOIN student_profiles sp ON sp.id = pr.profile_id
  LEFT JOIN early_access_requests ea ON lower(ea.referred_by) = lower(pr.code)
  GROUP BY pr.code, pr.nombre, pf.full_name, sp.avatar_url
  ORDER BY COUNT(ea.id) DESC, pr.code ASC;
$$;

REVOKE ALL ON FUNCTION public.public_promoter_ranking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_promoter_ranking() TO authenticated;