-- =============================================================================
-- MIGRACIÓN: Anuncios de comunidad (estilo LinkedIn) + compartir pasantías
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================
-- Objetivo:
--  * Los estudiantes NO crean pasantías nuevas en las comunidades.
--  * Pueden publicar ANUNCIOS / PROYECTOS (texto + link) estilo LinkedIn.
--  * Pueden COMPARTIR pasantías YA existentes (publicadas por empresas o
--    embajadores) dentro de las comunidades a las que pertenecen.
-- =============================================================================

-- 1) Tabla de anuncios/proyectos de la comunidad
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts_select_authenticated" ON community_posts;
CREATE POLICY "community_posts_select_authenticated" ON community_posts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "community_posts_insert_own" ON community_posts;
CREATE POLICY "community_posts_insert_own" ON community_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "community_posts_delete_own" ON community_posts;
CREATE POLICY "community_posts_delete_own" ON community_posts
  FOR DELETE USING (author_id = auth.uid());

-- 2) Permitir que MIEMBROS (y el creador) compartan pasantías EXISTENTES
--    dentro de sus comunidades (además de la empresa dueña).
DROP POLICY IF EXISTS "comm_internships_insert_member" ON community_internships;
CREATE POLICY "comm_internships_insert_member" ON community_internships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_internships.community_id
        AND community_members.student_id = auth.uid()
    )
    OR community_id IN (SELECT id FROM communities WHERE creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "comm_internships_delete_member" ON community_internships;
CREATE POLICY "comm_internships_delete_member" ON community_internships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_internships.community_id
        AND community_members.student_id = auth.uid()
    )
    OR community_id IN (SELECT id FROM communities WHERE creator_id = auth.uid())
  );

-- =============================================================================
-- FIN
-- =============================================================================
