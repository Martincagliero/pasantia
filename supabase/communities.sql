-- =============================================================================
-- COMUNIDADES DE ESTUDIANTES
-- Tabla communities + community_members + relacion con internships
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLA: communities (comunidades creadas por estudiantes)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  members_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABLA: community_members (relación N:N estudiantes-comunidades)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, student_id)
);

-- ─────────────────────────────────────────────
-- TABLA: community_internships (pasantías publicadas en comunidades)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  published_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, internship_id)
);

-- ─────────────────────────────────────────────
-- INDICES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_student ON community_members(student_id);
CREATE INDEX IF NOT EXISTS idx_community_internships_community ON community_internships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_internships_internship ON community_internships(internship_id);

-- =============================================================================
-- RLS POLÍTICAS
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLA: communities
-- ─────────────────────────────────────────────
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communities_select_own_or_public" ON communities;
CREATE POLICY "communities_select_own_or_public" ON communities
  FOR SELECT USING (creator_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "communities_insert_own" ON communities;
CREATE POLICY "communities_insert_own" ON communities
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "communities_update_own" ON communities;
CREATE POLICY "communities_update_own" ON communities
  FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "communities_delete_own" ON communities;
CREATE POLICY "communities_delete_own" ON communities
  FOR DELETE USING (creator_id = auth.uid());


-- ─────────────────────────────────────────────
-- TABLA: community_members
-- ─────────────────────────────────────────────
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_own_community" ON community_members;
CREATE POLICY "members_select_own_community" ON community_members
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "members_select_public_community" ON community_members;
CREATE POLICY "members_select_public_community" ON community_members
  FOR SELECT USING (
    community_id IN (SELECT id FROM communities WHERE is_public = true)
  );

DROP POLICY IF EXISTS "members_insert_own" ON community_members;
CREATE POLICY "members_insert_own" ON community_members
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "members_delete_own" ON community_members;
CREATE POLICY "members_delete_own" ON community_members
  FOR DELETE USING (student_id = auth.uid());


-- ─────────────────────────────────────────────
-- TABLA: community_internships
-- ─────────────────────────────────────────────
ALTER TABLE community_internships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_internships_select_authenticated" ON community_internships;
CREATE POLICY "comm_internships_select_authenticated" ON community_internships
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "comm_internships_insert_company" ON community_internships;
CREATE POLICY "comm_internships_insert_company" ON community_internships
  FOR INSERT WITH CHECK (
    internship_id IN (SELECT id FROM internships WHERE company_id = auth.uid())
  );

DROP POLICY IF EXISTS "comm_internships_delete_company" ON community_internships;
CREATE POLICY "comm_internships_delete_company" ON community_internships
  FOR DELETE USING (
    internship_id IN (SELECT id FROM internships WHERE company_id = auth.uid())
  );

-- =============================================================================
-- FIN
-- =============================================================================
