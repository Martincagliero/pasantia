-- =============================================================================
-- MIGRACIÓN: Foto de perfil para comunidades
-- Ejecutar en el SQL Editor de Supabase.
-- =============================================================================
-- Agrega la columna avatar_url a communities. Es opcional: si la comunidad no
-- sube una foto, la app muestra un ícono por defecto.
-- =============================================================================

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Imágenes para las comunidades DEMO que ya están creadas (solo si no tienen).
UPDATE public.communities SET avatar_url =
  'https://ui-avatars.com/api/?name=Sistemas+UBA&background=0A66C2&color=fff&size=256&bold=true'
  WHERE name = 'Comunidad Sistemas UBA (DEMO)' AND (avatar_url IS NULL OR avatar_url = '');

UPDATE public.communities SET avatar_url =
  'https://ui-avatars.com/api/?name=Ing+UTN&background=DC2626&color=fff&size=256&bold=true'
  WHERE name = 'Ingeniería Industrial UTN (DEMO)' AND (avatar_url IS NULL OR avatar_url = '');

UPDATE public.communities SET avatar_url =
  'https://ui-avatars.com/api/?name=UX+Arg&background=7C3AED&color=fff&size=256&bold=true'
  WHERE name = 'Diseño & UX Argentina (DEMO)' AND (avatar_url IS NULL OR avatar_url = '');

