-- =============================================================================
-- MIGRACIÓN: Reacciones (emojis) y comentarios en publicaciones/pasantías
-- Permite reaccionar con emojis y comentar en: novedades ('post'),
-- anuncios de comunidad ('community_post') y pasantías ('internship').
-- Visible para todos los usuarios autenticados.
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

-- ---- Reacciones (una por usuario por elemento; se puede cambiar de emoji) ----
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'community_post', 'internship')),
  target_id   UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (target_type, target_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_target ON public.post_reactions(target_type, target_id);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON public.post_reactions;
CREATE POLICY "reactions_select_all" ON public.post_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reactions_insert_own" ON public.post_reactions;
CREATE POLICY "reactions_insert_own" ON public.post_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reactions_update_own" ON public.post_reactions;
CREATE POLICY "reactions_update_own" ON public.post_reactions
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "reactions_delete_own" ON public.post_reactions;
CREATE POLICY "reactions_delete_own" ON public.post_reactions
  FOR DELETE USING (user_id = auth.uid());

-- ---- Comentarios ----
CREATE TABLE IF NOT EXISTS public.post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'community_post', 'internship')),
  target_id   UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_target ON public.post_comments(target_type, target_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON public.post_comments;
CREATE POLICY "comments_select_all" ON public.post_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON public.post_comments;
CREATE POLICY "comments_insert_own" ON public.post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "comments_delete_own" ON public.post_comments;
CREATE POLICY "comments_delete_own" ON public.post_comments
  FOR DELETE USING (user_id = auth.uid());
