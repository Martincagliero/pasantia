-- =============================================================================
-- MIGRACIÓN: Moderación de comunidades
--  - El creador (admin) puede ECHAR miembros de su comunidad.
--  - Un usuario echado queda BANEADO y no puede volver a unirse.
--  - Cualquiera puede unirse a comunidades públicas (mientras no esté baneado).
-- Ejecutar en Supabase -> SQL Editor -> Run (después de communities.sql).
-- =============================================================================

-- Tabla de baneos por comunidad.
CREATE TABLE IF NOT EXISTS public.community_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_bans_community_idx ON public.community_bans(community_id);

ALTER TABLE public.community_bans ENABLE ROW LEVEL SECURITY;

-- Ver baneos: el propio usuario baneado o el creador de la comunidad.
DROP POLICY IF EXISTS "community_bans_select" ON public.community_bans;
CREATE POLICY "community_bans_select" ON public.community_bans
  FOR SELECT USING (
    user_id = auth.uid()
    OR community_id IN (SELECT id FROM public.communities WHERE creator_id = auth.uid())
  );

-- Banear: solo el creador de la comunidad.
DROP POLICY IF EXISTS "community_bans_insert" ON public.community_bans;
CREATE POLICY "community_bans_insert" ON public.community_bans
  FOR INSERT WITH CHECK (
    community_id IN (SELECT id FROM public.communities WHERE creator_id = auth.uid())
  );

-- Quitar baneo: solo el creador.
DROP POLICY IF EXISTS "community_bans_delete" ON public.community_bans;
CREATE POLICY "community_bans_delete" ON public.community_bans
  FOR DELETE USING (
    community_id IN (SELECT id FROM public.communities WHERE creator_id = auth.uid())
  );

-- El creador puede ECHAR (borrar) miembros; el miembro también puede salir.
DROP POLICY IF EXISTS "members_delete_own" ON public.community_members;
DROP POLICY IF EXISTS "members_delete_own_or_creator" ON public.community_members;
CREATE POLICY "members_delete_own_or_creator" ON public.community_members
  FOR DELETE USING (
    student_id = auth.uid()
    OR community_id IN (SELECT id FROM public.communities WHERE creator_id = auth.uid())
  );

-- Unirse: cualquiera (a sí mismo) mientras NO esté baneado de esa comunidad.
DROP POLICY IF EXISTS "members_insert_own" ON public.community_members;
DROP POLICY IF EXISTS "members_insert_not_banned" ON public.community_members;
CREATE POLICY "members_insert_not_banned" ON public.community_members
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.community_bans b
      WHERE b.community_id = community_id AND b.user_id = auth.uid()
    )
  );

-- =============================================================================
-- La app: en "Mis comunidades" se listan TODAS las públicas y cualquiera se une.
-- En el detalle, el creador ve los miembros y puede echarlos (quedan baneados).
-- =============================================================================
