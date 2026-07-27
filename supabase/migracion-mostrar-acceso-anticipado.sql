-- =============================================================================
-- MIGRACIÓN: Mostrar en "Explorar perfiles" a quienes se registraron por el
-- formulario de Acceso Anticipado (aunque todavía no hayan ingresado).
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de:
--   migracion-acceso-anticipado.sql
--   migracion-prefill-perfil.sql
-- =============================================================================
-- Qué hace:
--  * ESTUDIANTES: los deja como públicos (is_public = true) para que aparezcan
--    en el directorio. La RLS solo muestra estudiantes con is_public = true.
--  * El trigger de alta ahora crea a los estudiantes ya públicos.
--  * BACKFILL: marca públicos a los estudiantes ya creados que vinieron del
--    formulario de acceso anticipado.
--  * EMPRESAS: ya son visibles para cualquier usuario autenticado (no requiere
--    cambios). EMBAJADORES/COMUNIDADES: la app ya los muestra a todos (el tilde
--    de verificado se muestra solo si el admin los verificó).
-- Nota: un estudiante puede volver a ocultarse desde su perfil (is_public=false).
-- =============================================================================

-- 1) Trigger de alta: crear a los estudiantes ya públicos + pre-cargar datos.
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
  VALUES (new.id, v_role, v_name, coalesce(new.email, ''))
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
        email     = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email);

  IF v_role = 'estudiante' THEN
    INSERT INTO public.student_profiles (id, university, career, year, area, availability, phone, bio, instagram_url, is_public)
    VALUES (
      new.id,
      nullif(v_ea.universidad, ''),
      nullif(v_ea.carrera, ''),
      nullif(v_ea.anio, ''),
      nullif(v_ea.area, ''),
      nullif(v_ea.disponibilidad, ''),
      nullif(v_ea.telefono, ''),
      nullif(v_ea.perfil, ''),
      nullif(v_ea.instagram_link, ''),
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      university   = COALESCE(NULLIF(public.student_profiles.university, ''),   EXCLUDED.university),
      career       = COALESCE(NULLIF(public.student_profiles.career, ''),       EXCLUDED.career),
      year         = COALESCE(NULLIF(public.student_profiles.year, ''),         EXCLUDED.year),
      area         = COALESCE(NULLIF(public.student_profiles.area, ''),         EXCLUDED.area),
      availability = COALESCE(NULLIF(public.student_profiles.availability, ''), EXCLUDED.availability),
      phone        = COALESCE(NULLIF(public.student_profiles.phone, ''),        EXCLUDED.phone),
      bio          = COALESCE(NULLIF(public.student_profiles.bio, ''),          EXCLUDED.bio),
      instagram_url = COALESCE(NULLIF(public.student_profiles.instagram_url, ''), EXCLUDED.instagram_url),
      is_public    = true;

  ELSIF v_role = 'empresa' THEN
    INSERT INTO public.company_profiles (id, company_name, industry, size, description)
    VALUES (
      new.id,
      COALESCE(nullif(v_ea.empresa, ''), nullif(v_ea.nombre, '')),
      nullif(v_ea.rubro, ''),
      nullif(v_ea.tamano, ''),
      COALESCE(nullif(v_ea.perfil, ''), nullif(v_ea.mensaje, ''))
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = COALESCE(NULLIF(public.company_profiles.company_name, ''), EXCLUDED.company_name),
      industry     = COALESCE(NULLIF(public.company_profiles.industry, ''),     EXCLUDED.industry),
      size         = COALESCE(NULLIF(public.company_profiles.size, ''),         EXCLUDED.size),
      description  = COALESCE(NULLIF(public.company_profiles.description, ''),   EXCLUDED.description);

  ELSIF v_role = 'embajador' THEN
    INSERT INTO public.ambassador_profiles (id, org_name, org_type, university, instagram_url, reach, description)
    VALUES (
      new.id,
      COALESCE(nullif(v_ea.org_name, ''), v_name),
      nullif(v_ea.org_type, ''),
      nullif(v_ea.universidad, ''),
      nullif(v_ea.instagram_link, ''),
      nullif(v_ea.followers_range, ''),
      COALESCE(nullif(v_ea.perfil, ''), nullif(v_ea.mensaje, ''))
    )
    ON CONFLICT (id) DO UPDATE SET
      org_name      = COALESCE(NULLIF(public.ambassador_profiles.org_name, ''),      EXCLUDED.org_name),
      org_type      = COALESCE(NULLIF(public.ambassador_profiles.org_type, ''),      EXCLUDED.org_type),
      university    = COALESCE(NULLIF(public.ambassador_profiles.university, ''),     EXCLUDED.university),
      instagram_url = COALESCE(NULLIF(public.ambassador_profiles.instagram_url, ''), EXCLUDED.instagram_url),
      reach         = COALESCE(NULLIF(public.ambassador_profiles.reach, ''),         EXCLUDED.reach),
      description   = COALESCE(NULLIF(public.ambassador_profiles.description, ''),    EXCLUDED.description);
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
-- 2) BACKFILL: hacer públicos a los estudiantes YA creados que se registraron
--    por el formulario de acceso anticipado (para que aparezcan en el directorio).
-- =============================================================================
UPDATE public.student_profiles sp
SET is_public = true
FROM public.profiles p
WHERE sp.id = p.id
  AND p.role = 'estudiante'
  AND sp.is_public IS DISTINCT FROM true
  AND EXISTS (
    SELECT 1 FROM public.early_access_requests e
    WHERE lower(e.email) = lower(p.email)
  );
-- =============================================================================
