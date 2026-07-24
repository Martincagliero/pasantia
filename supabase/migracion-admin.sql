-- =============================================================================
-- MIGRACIÓN: Panel de administración (solo para el dueño)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de migracion-promotores.sql
-- =============================================================================
-- Da acceso, SOLO a usuarios marcados como admin, a:
--   * Ver todos los usuarios registrados y su rol.
--   * Ver todas las solicitudes del formulario de acceso anticipado.
--   * Cambiar el estado de una solicitud (pendiente / activado).
--   * Ver el ranking de promotores y crear enlaces de promotor.
-- Todo pasa por funciones SECURITY DEFINER que verifican que seas admin, así
-- las tablas siguen privadas para el resto.
-- =============================================================================

-- 1) Marca de administrador en el perfil
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) Helper: ¿el usuario logueado es admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), FALSE);
$$;

-- 3) Listar todos los usuarios registrados (con su rol)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id         uuid,
  role       user_role,
  full_name  text,
  email      text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  RETURN QUERY
    SELECT p.id, p.role, p.full_name, p.email, p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- 4) Listar todas las solicitudes del formulario (lo que fueron llenando)
CREATE OR REPLACE FUNCTION public.admin_list_requests()
RETURNS SETOF early_access_requests
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  RETURN QUERY
    SELECT * FROM early_access_requests ORDER BY created_at DESC;
END;
$$;

-- 5) Cambiar el estado de una solicitud (pendiente / activado)
CREATE OR REPLACE FUNCTION public.admin_set_request_status(p_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  UPDATE early_access_requests SET status = p_status WHERE id = p_id;
END;
$$;

-- 6) Ranking de promotores
CREATE OR REPLACE FUNCTION public.admin_promoter_stats()
RETURNS SETOF promoter_stats
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  RETURN QUERY SELECT * FROM promoter_stats;
END;
$$;

-- 7) Crear / actualizar un promotor (para generar su enlace)
CREATE OR REPLACE FUNCTION public.admin_upsert_promoter(
  p_code      text,
  p_nombre    text DEFAULT NULL,
  p_email     text DEFAULT NULL,
  p_instagram text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  INSERT INTO promoters (code, nombre, email, instagram)
  VALUES (lower(trim(p_code)), p_nombre, p_email, p_instagram)
  ON CONFLICT (code) DO UPDATE
    SET nombre    = COALESCE(EXCLUDED.nombre, promoters.nombre),
        email     = COALESCE(EXCLUDED.email, promoters.email),
        instagram = COALESCE(EXCLUDED.instagram, promoters.instagram);
END;
$$;

-- 8) Permisos: solo usuarios autenticados pueden ejecutarlas (adentro se valida admin)
REVOKE ALL ON FUNCTION public.is_admin()                                   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users()                           FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_requests()                        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_request_status(uuid, text)         FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_promoter_stats()                       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_upsert_promoter(text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin()                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users()                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_requests()                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_request_status(uuid, text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_promoter_stats()                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_promoter(text, text, text, text) TO authenticated;

-- =============================================================================
-- IMPORTANTE: convertite en admin (reemplazá por TU email de la app)
--   UPDATE profiles SET is_admin = TRUE WHERE lower(email) = lower('tu@email.com');
-- Verificar:
--   SELECT email, is_admin FROM profiles WHERE is_admin;
-- =============================================================================
