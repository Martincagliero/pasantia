-- =============================================================================
-- MIGRACIÓN: Foto de perfil para comunidades
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================================
-- Agrega la columna avatar_url a communities. Es opcional: si la comunidad no
-- sube una foto, la app muestra un ícono por defecto.
-- =============================================================================

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS avatar_url text;
