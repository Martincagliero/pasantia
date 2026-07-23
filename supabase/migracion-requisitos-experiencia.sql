-- Migración: módulo opcional de requisitos con años de experiencia
-- Agrega la columna experience_years a internships (nullable).
-- Correr en el SQL Editor de Supabase.

ALTER TABLE internships
  ADD COLUMN IF NOT EXISTS experience_years INTEGER;

COMMENT ON COLUMN internships.experience_years IS 'Años de experiencia requeridos (opcional). NULL = no especificado.';
