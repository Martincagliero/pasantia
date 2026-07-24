-- =============================================================================
-- MIGRACIÓN: Promotores + tracking de referidos
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================================
-- Idea:
--  * Cada promotor tiene un CÓDIGO (ej: "juan"). Comparte su enlace:
--        https://TU-DOMINIO/?ref=juan
--  * Cuando alguien entra con ese enlace y deja su solicitud de acceso
--    anticipado, guardamos su código en early_access_requests.referred_by.
--  * Con la vista promoter_stats ves cuánta gente trajo cada promotor.
-- =============================================================================

-- 1) Guardar el código de quien lo refirió en cada solicitud
ALTER TABLE early_access_requests
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

COMMENT ON COLUMN early_access_requests.referred_by IS
  'Código del promotor que trajo a esta persona (viene del ?ref= del enlace). NULL = orgánico.';

CREATE INDEX IF NOT EXISTS idx_early_access_referred_by
  ON early_access_requests(lower(referred_by));

-- 2) Tabla de promotores (opcional pero recomendada): tu listado oficial
CREATE TABLE IF NOT EXISTS promoters (
  code       TEXT PRIMARY KEY,                 -- el que va en ?ref=  (ej: 'juan')
  nombre     TEXT,                             -- nombre real del promotor
  email      TEXT,
  instagram  TEXT,
  notas      TEXT,
  activo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privada: nadie la lee desde la API pública (solo vos desde el panel de Supabase).
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;

-- 3) Vista de métricas: cuántos referidos trajo cada promotor
--    (incluye a los que todavía no cargaste en la tabla promoters).
CREATE OR REPLACE VIEW promoter_stats AS
SELECT
  lower(ea.referred_by)                                   AS code,
  p.nombre,
  COUNT(*)                                                AS total,
  COUNT(*) FILTER (WHERE ea.rol = 'estudiante')           AS estudiantes,
  COUNT(*) FILTER (WHERE ea.rol = 'empresa')              AS empresas,
  COUNT(*) FILTER (WHERE ea.rol = 'embajador')            AS embajadores,
  COUNT(*) FILTER (WHERE ea.status = 'activado')          AS activados,
  MAX(ea.created_at)                                      AS ultimo_registro
FROM early_access_requests ea
LEFT JOIN promoters p ON lower(p.code) = lower(ea.referred_by)
WHERE ea.referred_by IS NOT NULL AND ea.referred_by <> ''
GROUP BY lower(ea.referred_by), p.nombre
ORDER BY total DESC;

-- =============================================================================
-- CÓMO USARLO (para vos)
-- =============================================================================
-- Dar de alta un promotor:
--   INSERT INTO promoters (code, nombre, email, instagram)
--   VALUES ('juan', 'Juan Pérez', 'juan@mail.com', '@juanp');
--   -> su enlace es:  https://TU-DOMINIO/?ref=juan
--
-- Ver el ranking de promotores:
--   SELECT * FROM promoter_stats;
--
-- Ver a quién trajo un promotor puntual:
--   SELECT nombre, email, rol, created_at
--     FROM early_access_requests
--     WHERE lower(referred_by) = 'juan'
--     ORDER BY created_at DESC;
-- =============================================================================


-- =============================================================================
-- SECCIÓN "PROMOTORES" PARA ESTUDIANTES (self-service)
-- Cada estudiante tiene su propio código y su enlace ?ref=. Desde el panel ve
-- SOLO sus propias métricas (sin ver datos personales de los referidos).
-- =============================================================================

-- 4) Código de promotor por estudiante
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 5) Genera (si no existe) y devuelve el código del estudiante logueado
CREATE OR REPLACE FUNCTION public.ensure_my_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code text;
  v_try  text;
  i      int := 0;
BEGIN
  SELECT referral_code INTO v_code FROM student_profiles WHERE id = auth.uid();
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    -- Código corto y único derivado del usuario + tiempo
    v_try := lower(substr(md5(auth.uid()::text || clock_timestamp()::text || i::text), 1, 8));
    BEGIN
      UPDATE student_profiles SET referral_code = v_try WHERE id = auth.uid();
      RETURN v_try;
    EXCEPTION WHEN unique_violation THEN
      i := i + 1;
      IF i > 10 THEN RAISE; END IF;
    END;
  END LOOP;
END;
$$;

-- 6) Devuelve SOLO los totales del estudiante logueado (no expone datos personales)
CREATE OR REPLACE FUNCTION public.my_referral_stats()
RETURNS TABLE (
  total       bigint,
  estudiantes bigint,
  empresas    bigint,
  embajadores bigint,
  activados   bigint
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT referral_code INTO v_code FROM student_profiles WHERE id = auth.uid();
  IF v_code IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      COUNT(*)::bigint,
      COUNT(*) FILTER (WHERE rol = 'estudiante')::bigint,
      COUNT(*) FILTER (WHERE rol = 'empresa')::bigint,
      COUNT(*) FILTER (WHERE rol = 'embajador')::bigint,
      COUNT(*) FILTER (WHERE status = 'activado')::bigint
    FROM early_access_requests
    WHERE lower(referred_by) = lower(v_code);
END;
$$;

-- Solo usuarios autenticados pueden ejecutarlas
REVOKE ALL ON FUNCTION public.ensure_my_referral_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.my_referral_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_referral_stats() TO authenticated;
-- =============================================================================
