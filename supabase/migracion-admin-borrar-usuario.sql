-- =============================================================================
-- MIGRACIÓN: permitir al admin borrar una cuenta registrada (spam, pruebas, etc.)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de migracion-admin.sql
-- =============================================================================
-- Borra directamente de auth.users: como profiles.id referencia auth.users(id)
-- ON DELETE CASCADE (y las subtablas referencian profiles.id también en cascada),
-- se borra todo lo asociado a esa cuenta (profile, student/company/ambassador_profiles,
-- posts, mensajes, postulaciones, etc.) en un solo paso.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'no podés borrar tu propia cuenta';
  END IF;
  DELETE FROM auth.users WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
