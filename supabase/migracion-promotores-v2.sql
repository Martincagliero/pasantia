-- =============================================================================
-- MIGRACIÓN: Promotores v2 — asignación por el admin + ranking público
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de migracion-promotores.sql
-- y migracion-admin.sql.
-- =============================================================================
-- Cambios respecto de v1:
--  * Los estudiantes YA NO generan su código solos.
--  * El admin ASIGNA a un perfil (usuario registrado) su código de promotor.
--  * Todos los usuarios ven un RANKING de promotores (nombre + cuántos sumó).
--  * Un promotor ve su enlace personal y sus propios totales.
-- =============================================================================

-- 1) Vincular cada código de promotor a un perfil (usuario registrado)
ALTER TABLE promoters
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promoters_profile
  ON promoters(profile_id) WHERE profile_id IS NOT NULL;

-- 2) Quitar la autogeneración de la v1 (ya no se usa)
DROP FUNCTION IF EXISTS public.ensure_my_referral_code();
DROP FUNCTION IF EXISTS public.my_referral_stats();

-- 3) El promotor logueado: su código + sus totales (o sin filas si no es promotor)
CREATE OR REPLACE FUNCTION public.my_promoter()
RETURNS TABLE (
  code        text,
  total       bigint,
  estudiantes bigint,
  empresas    bigint,
  embajadores bigint,
  activados   bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT pr.code INTO v_code FROM promoters pr WHERE pr.profile_id = auth.uid() LIMIT 1;
  IF v_code IS NULL THEN
    RETURN; -- no es promotor: sin filas
  END IF;

  RETURN QUERY
    SELECT
      v_code,
      COUNT(*)::bigint,
      COUNT(*) FILTER (WHERE rol = 'estudiante')::bigint,
      COUNT(*) FILTER (WHERE rol = 'empresa')::bigint,
      COUNT(*) FILTER (WHERE rol = 'embajador')::bigint,
      COUNT(*) FILTER (WHERE status = 'activado')::bigint
    FROM early_access_requests
    WHERE lower(referred_by) = lower(v_code);
END;
$$;

-- 4) Ranking público de promotores (lo ven todos los usuarios logueados).
--    Solo nombre + totales: NO expone datos personales de los referidos.
CREATE OR REPLACE FUNCTION public.public_promoter_ranking()
RETURNS TABLE (
  nombre    text,
  total     bigint,
  activados bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(pr.nombre, ''), pf.full_name, pr.code)          AS nombre,
    COUNT(ea.id)::bigint                                            AS total,
    COUNT(ea.id) FILTER (WHERE ea.status = 'activado')::bigint      AS activados
  FROM promoters pr
  LEFT JOIN profiles pf ON pf.id = pr.profile_id
  LEFT JOIN early_access_requests ea ON lower(ea.referred_by) = lower(pr.code)
  GROUP BY pr.code, pr.nombre, pf.full_name
  ORDER BY total DESC, nombre ASC;
$$;

-- 5) Admin: asignar (o reasignar) un código de promotor a un perfil
CREATE OR REPLACE FUNCTION public.admin_assign_promoter(p_profile_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code  text;
  v_name  text;
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  v_code := lower(trim(p_code));
  IF v_code = '' THEN
    RAISE EXCEPTION 'codigo vacio';
  END IF;

  SELECT full_name, email INTO v_name, v_email FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil inexistente';
  END IF;

  -- Si ese perfil ya tenía otro código, lo liberamos
  DELETE FROM promoters WHERE profile_id = p_profile_id AND code <> v_code;

  INSERT INTO promoters (code, profile_id, nombre, email)
  VALUES (v_code, p_profile_id, v_name, v_email)
  ON CONFLICT (code) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        nombre     = EXCLUDED.nombre,
        email      = EXCLUDED.email;
END;
$$;

-- 6) Admin: quitar el rol de promotor a un perfil
CREATE OR REPLACE FUNCTION public.admin_remove_promoter(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  DELETE FROM promoters WHERE lower(code) = lower(trim(p_code));
END;
$$;

-- 7) Permisos
REVOKE ALL ON FUNCTION public.my_promoter()                          FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_promoter_ranking()              FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_assign_promoter(uuid, text)      FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_remove_promoter(text)            FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.my_promoter()                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_promoter_ranking()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_promoter(uuid, text)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_promoter(text)         TO authenticated;
-- =============================================================================

-- 8) Admin: listar TODOS los promotores (incluye los que tienen 0 registros).
--    Reemplaza la versión que dependía de la vista promoter_stats (que solo
--    mostraba promotores con al menos un referido).
DROP FUNCTION IF EXISTS public.admin_promoter_stats();
CREATE OR REPLACE FUNCTION public.admin_promoter_stats()
RETURNS TABLE (
  code            text,
  nombre          text,
  total           bigint,
  estudiantes     bigint,
  empresas        bigint,
  embajadores     bigint,
  activados       bigint,
  ultimo_registro timestamptz
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
      pr.code,
      COALESCE(NULLIF(pr.nombre, ''), pf.full_name, pr.code),
      COUNT(ea.id)::bigint,
      COUNT(ea.id) FILTER (WHERE ea.rol = 'estudiante')::bigint,
      COUNT(ea.id) FILTER (WHERE ea.rol = 'empresa')::bigint,
      COUNT(ea.id) FILTER (WHERE ea.rol = 'embajador')::bigint,
      COUNT(ea.id) FILTER (WHERE ea.status = 'activado')::bigint,
      MAX(ea.created_at)
    FROM promoters pr
    LEFT JOIN profiles pf ON pf.id = pr.profile_id
    LEFT JOIN early_access_requests ea ON lower(ea.referred_by) = lower(pr.code)
    GROUP BY pr.code, pr.nombre, pf.full_name
    ORDER BY COUNT(ea.id) DESC, pr.code ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_promoter_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_promoter_stats() TO authenticated;
-- =============================================================================
