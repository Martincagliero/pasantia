-- =============================================================================
-- MIGRACIÓN: Foto de perfil obligatoria (estilo LinkedIn)
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================
-- Agrega la columna avatar_url a estudiantes y empresas.
-- (Los embajadores ya tienen logo_url.)
-- Las fotos se suben al bucket "cvs" en la carpeta avatars/.
-- =============================================================================

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =============================================================================
-- FIN
-- =============================================================================
