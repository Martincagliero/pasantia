-- =============================================================================
-- MIGRACIÓN: Verificación de cuentas (tick azul) para estudiantes y empresas
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================
-- Los embajadores ya tienen "verified". Agregamos lo mismo a estudiantes y
-- empresas, más un flag para registrar que pidieron la verificación.
-- =============================================================================

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

ALTER TABLE ambassador_profiles ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

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
-- Ver quién pidió verificación y todavía no está verificado:
-- SELECT p.email, p.full_name, p.role
--   FROM profiles p
--   LEFT JOIN student_profiles s ON s.id = p.id
--   LEFT JOIN company_profiles c ON c.id = p.id
--   LEFT JOIN ambassador_profiles a ON a.id = p.id
--   WHERE COALESCE(s.verification_requested, c.verification_requested, a.verification_requested) = true
--     AND COALESCE(s.verified, c.verified, a.verified) = false;
-- =============================================================================
