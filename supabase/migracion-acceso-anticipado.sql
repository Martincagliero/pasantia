-- =============================================================================
-- MIGRACIÓN: Acceso anticipado como "lista de espera" + alta controlada
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================
-- Flujo:
--  1. La gente completa el formulario de Acceso Anticipado -> se guarda acá
--     (early_access_requests) con status = 'pendiente'. No crea usuario todavía.
--  2. Vos (dueño) revisás la lista y ACTIVÁS a quien quieras invitándolo:
--     Supabase -> Authentication -> Users -> "Invite user" (poné su email).
--     Eso le crea el usuario y le manda un mail para poner su contraseña.
--  3. Al crearse el usuario, el trigger le arma el perfil con el ROL que había
--     elegido en el formulario (lo busca por email). Ya puede ingresar.
-- =============================================================================

-- 1) Tabla de solicitudes (lista de espera)
CREATE TABLE IF NOT EXISTS early_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol TEXT,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  universidad TEXT,
  carrera TEXT,
  anio TEXT,
  area TEXT,
  disponibilidad TEXT,
  empresa TEXT,
  rubro TEXT,
  tamano TEXT,
  perfil TEXT,
  org_name TEXT,
  org_type TEXT,
  instagram_link TEXT,
  followers_range TEXT,
  mensaje TEXT,
  origen TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_early_access_email ON early_access_requests(lower(email));
CREATE INDEX IF NOT EXISTS idx_early_access_status ON early_access_requests(status);

ALTER TABLE early_access_requests ENABLE ROW LEVEL SECURITY;

-- Cualquiera (anon) puede DEJAR su solicitud...
DROP POLICY IF EXISTS "early_access_insert_public" ON early_access_requests;
CREATE POLICY "early_access_insert_public" ON early_access_requests
  FOR INSERT WITH CHECK (true);

-- ...pero NADIE puede leerlas desde la API (solo vos desde el panel de Supabase,
-- que usa la service key y saltea RLS). Así la lista queda privada.

-- 2) Trigger de alta: usa el rol de los metadatos y, si no hay (caso "Invite"),
--    lo busca en early_access_requests por email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_name text;
  v_ea   record;
BEGIN
  -- Última solicitud de acceso anticipado con ese email (si existe)
  SELECT * INTO v_ea
    FROM public.early_access_requests
    WHERE lower(email) = lower(new.email)
    ORDER BY created_at DESC
    LIMIT 1;

  -- Rol: 1) metadata del signUp, 2) el que eligió en el formulario, 3) estudiante
  v_role := CASE
    WHEN nullif(new.raw_user_meta_data->>'role', '') IN ('estudiante', 'empresa', 'embajador')
      THEN (new.raw_user_meta_data->>'role')::user_role
    WHEN v_ea.rol IN ('estudiante', 'empresa', 'embajador')
      THEN v_ea.rol::user_role
    ELSE 'estudiante'::user_role
  END;

  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    v_ea.nombre,
    v_ea.org_name,
    ''
  );

  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (new.id, v_role, v_name, coalesce(new.email, ''));

  IF v_role = 'estudiante' THEN
    INSERT INTO public.student_profiles (id) VALUES (new.id);
  ELSIF v_role = 'empresa' THEN
    INSERT INTO public.company_profiles (id) VALUES (new.id);
  ELSIF v_role = 'embajador' THEN
    INSERT INTO public.ambassador_profiles (id, org_name)
    VALUES (new.id, coalesce(v_ea.org_name, v_name, ''));
  END IF;

  -- Marcar la solicitud como activada
  UPDATE public.early_access_requests
    SET status = 'activado'
    WHERE lower(email) = lower(new.email) AND coalesce(status, '') <> 'activado';

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- CONSULTAS ÚTILES (para vos)
-- =============================================================================
-- Ver solicitudes pendientes:
-- SELECT nombre, email, rol, telefono, universidad, empresa, org_name, created_at
--   FROM early_access_requests
--   WHERE status = 'pendiente'
--   ORDER BY created_at DESC;
--
-- Marcar como pendiente de nuevo (si hiciera falta):
-- UPDATE early_access_requests SET status = 'pendiente' WHERE email = 'correo@ejemplo.com';
--
-- ACTIVAR / dar acceso: Authentication -> Users -> "Invite user" con ese email.
--   (Le llega un mail para crear su contraseña; al entrar ya tiene su rol.)
-- =============================================================================
