-- =============================================================================
-- MIGRACIÓN: Verificación de cuentas (tick azul) para estudiantes y empresas
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================
-- Los embajadores ya tienen "verified". Agregamos lo mismo a estudiantes y
-- empresas. La verificación se administra directamente desde el panel admin.
-- =============================================================================

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- =============================================================================
-- CÓMO ACTIVAR UNA VERIFICACIÓN (lo hacés vos, el dueño):
-- Reemplazá el email y ejecutá SOLO la línea del rol que corresponda.
-- =============================================================================
-- Estudiante:
-- UPDATE student_profiles SET verified = true
--   WHERE id = (SELECT id FROM profiles WHERE email = 'correo@ejemplo.com');
--
-- Empresa:
-- UPDATE company_profiles SET verified = true
--   WHERE id = (SELECT id FROM profiles WHERE email = 'correo@ejemplo.com');
--
-- Embajador:
-- UPDATE ambassador_profiles SET verified = true
--   WHERE id = (SELECT id FROM profiles WHERE email = 'correo@ejemplo.com');
--
-- =============================================================================
