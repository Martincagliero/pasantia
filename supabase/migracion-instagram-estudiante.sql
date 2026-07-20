-- =============================================================================
-- MIGRACIÓN: Instagram del estudiante
-- Permite que el estudiante cargue su Instagram (además del teléfono/WhatsApp
-- y los links ya existentes). Visible para todos los roles en "Explorar perfiles".
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
