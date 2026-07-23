-- =============================================================================
-- MIGRACIÓN: "Red" — seguir empresas / conectar con estudiantes (follows)
-- Relación unidireccional: follower_id sigue a following_id.
--  - Empresas/embajadores: "Seguir".
--  - Estudiantes: "Conectar" (amigos).
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Ver: cualquier usuario autenticado puede leer relaciones (contar seguidores, etc.)
DROP POLICY IF EXISTS "follows_select" ON public.follows;
CREATE POLICY "follows_select" ON public.follows
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seguir: solo podés crear relaciones donde vos sos el follower.
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
CREATE POLICY "follows_insert" ON public.follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

-- Dejar de seguir: solo podés borrar tus propias relaciones.
DROP POLICY IF EXISTS "follows_delete" ON public.follows;
CREATE POLICY "follows_delete" ON public.follows
  FOR DELETE USING (follower_id = auth.uid());

-- =============================================================================
-- Listo. La app usa esta tabla en "Explorar perfiles" (botón Seguir/Conectar)
-- y en la pestaña "Red" (empresas seguidas, amigos y feed de novedades).
-- =============================================================================
