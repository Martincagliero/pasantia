-- =============================================================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS — PasantIA
-- Ejecutar TODO ESTO en Supabase SQL Editor (en una sola query)
-- =============================================================================

-- =============================================================================
-- 1. COMUNIDADES DE ESTUDIANTES
-- =============================================================================
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

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, student_id)
);

CREATE TABLE IF NOT EXISTS community_internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  published_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, internship_id)
);

CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_student ON community_members(student_id);
CREATE INDEX IF NOT EXISTS idx_community_internships_community ON community_internships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_internships_internship ON community_internships(internship_id);

-- RLS para communities
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

-- RLS para community_members
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

-- RLS para community_internships
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
-- 2. RLS POLÍTICAS COMPLETAS
-- =============================================================================

-- Helper SECURITY DEFINER: rol del usuario actual sin disparar RLS.
-- Se usa en las políticas de internships para EVITAR la recursión infinita
-- (profiles -> internships -> profiles).
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

-- TABLA: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- TABLA: student_profiles
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_profiles_select_own" ON student_profiles;
CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "student_profiles_select_public" ON student_profiles;
CREATE POLICY "student_profiles_select_public" ON student_profiles
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "student_profiles_update_own" ON student_profiles;
CREATE POLICY "student_profiles_update_own" ON student_profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "student_profiles_insert_own" ON student_profiles;
CREATE POLICY "student_profiles_insert_own" ON student_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- TABLA: company_profiles
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_profiles_select_authenticated" ON company_profiles;
CREATE POLICY "company_profiles_select_authenticated" ON company_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "company_profiles_update_own" ON company_profiles;
CREATE POLICY "company_profiles_update_own" ON company_profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "company_profiles_insert_own" ON company_profiles;
CREATE POLICY "company_profiles_insert_own" ON company_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- TABLA: ambassador_profiles
ALTER TABLE ambassador_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ambassador_profiles_select_own" ON ambassador_profiles;
CREATE POLICY "ambassador_profiles_select_own" ON ambassador_profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "ambassador_profiles_select_verified" ON ambassador_profiles;
CREATE POLICY "ambassador_profiles_select_verified" ON ambassador_profiles
  FOR SELECT USING (verified = true);

DROP POLICY IF EXISTS "ambassador_profiles_update_own" ON ambassador_profiles;
CREATE POLICY "ambassador_profiles_update_own" ON ambassador_profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "ambassador_profiles_insert_own" ON ambassador_profiles;
CREATE POLICY "ambassador_profiles_insert_own" ON ambassador_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- TABLA: internships
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internships_select_active" ON internships;
CREATE POLICY "internships_select_active" ON internships
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "internships_select_own_company" ON internships;
CREATE POLICY "internships_select_own_company" ON internships
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "internships_insert_own" ON internships;
CREATE POLICY "internships_insert_own" ON internships
  FOR INSERT WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "internships_update_own" ON internships;
CREATE POLICY "internships_update_own" ON internships
  FOR UPDATE USING (company_id = auth.uid());

DROP POLICY IF EXISTS "internships_delete_own" ON internships;
CREATE POLICY "internships_delete_own" ON internships
  FOR DELETE USING (company_id = auth.uid());

DROP POLICY IF EXISTS "internships_insert_ambassador" ON internships;
CREATE POLICY "internships_insert_ambassador" ON internships
  FOR INSERT WITH CHECK (
    company_id = auth.uid() AND public.auth_role() = 'embajador'
  );

DROP POLICY IF EXISTS "internships_update_ambassador" ON internships;
CREATE POLICY "internships_update_ambassador" ON internships
  FOR UPDATE USING (
    company_id = auth.uid() AND public.auth_role() = 'embajador'
  );

DROP POLICY IF EXISTS "internships_delete_ambassador" ON internships;
CREATE POLICY "internships_delete_ambassador" ON internships
  FOR DELETE USING (
    company_id = auth.uid() AND public.auth_role() = 'embajador'
  );

-- TABLA: applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select_student" ON applications;
CREATE POLICY "applications_select_student" ON applications
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "applications_select_company" ON applications;
CREATE POLICY "applications_select_company" ON applications
  FOR SELECT USING (
    internship_id IN (
      SELECT id FROM internships WHERE company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "applications_insert_student" ON applications;
CREATE POLICY "applications_insert_student" ON applications
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "applications_delete_student" ON applications;
CREATE POLICY "applications_delete_student" ON applications
  FOR DELETE USING (student_id = auth.uid());

DROP POLICY IF EXISTS "applications_update_company" ON applications;
CREATE POLICY "applications_update_company" ON applications
  FOR UPDATE USING (
    internship_id IN (
      SELECT id FROM internships WHERE company_id = auth.uid()
    )
  );

-- TABLA: saved_internships
ALTER TABLE saved_internships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_select_own" ON saved_internships;
CREATE POLICY "saved_select_own" ON saved_internships
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "saved_insert_own" ON saved_internships;
CREATE POLICY "saved_insert_own" ON saved_internships
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "saved_delete_own" ON saved_internships;
CREATE POLICY "saved_delete_own" ON saved_internships
  FOR DELETE USING (student_id = auth.uid());

-- TABLA: ambassador_posts
ALTER TABLE ambassador_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_own" ON ambassador_posts;
CREATE POLICY "posts_select_own" ON ambassador_posts
  FOR SELECT USING (ambassador_id = auth.uid());

DROP POLICY IF EXISTS "posts_select_verified_ambassadors" ON ambassador_posts;
CREATE POLICY "posts_select_verified_ambassadors" ON ambassador_posts
  FOR SELECT USING (
    ambassador_id IN (
      SELECT id FROM ambassador_profiles WHERE verified = true
    )
  );

DROP POLICY IF EXISTS "posts_insert_own" ON ambassador_posts;
CREATE POLICY "posts_insert_own" ON ambassador_posts
  FOR INSERT WITH CHECK (ambassador_id = auth.uid());

DROP POLICY IF EXISTS "posts_update_own" ON ambassador_posts;
CREATE POLICY "posts_update_own" ON ambassador_posts
  FOR UPDATE USING (ambassador_id = auth.uid());

DROP POLICY IF EXISTS "posts_delete_own" ON ambassador_posts;
CREATE POLICY "posts_delete_own" ON ambassador_posts
  FOR DELETE USING (ambassador_id = auth.uid());

-- TABLA: internship_diffusions
ALTER TABLE internship_diffusions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diffusions_select_all_authenticated" ON internship_diffusions;
CREATE POLICY "diffusions_select_all_authenticated" ON internship_diffusions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "diffusions_insert_own" ON internship_diffusions;
CREATE POLICY "diffusions_insert_own" ON internship_diffusions
  FOR INSERT WITH CHECK (ambassador_id = auth.uid());

DROP POLICY IF EXISTS "diffusions_delete_own" ON internship_diffusions;
CREATE POLICY "diffusions_delete_own" ON internship_diffusions
  FOR DELETE USING (ambassador_id = auth.uid());

-- TABLA: internship_broadcasts
ALTER TABLE internship_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcasts_select_own" ON internship_broadcasts;
CREATE POLICY "broadcasts_select_own" ON internship_broadcasts
  FOR SELECT USING (ambassador_id = auth.uid());

DROP POLICY IF EXISTS "broadcasts_insert_company" ON internship_broadcasts;
CREATE POLICY "broadcasts_insert_company" ON internship_broadcasts
  FOR INSERT WITH CHECK (
    internship_id IN (SELECT id FROM internships WHERE company_id = auth.uid())
  );

-- TABLA: posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_authenticated" ON posts;
CREATE POLICY "posts_select_authenticated" ON posts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE USING (author_id = auth.uid());

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'early_access_requests') THEN
    EXECUTE 'ALTER TABLE early_access_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "early_access_insert_public" ON early_access_requests';
    EXECUTE 'CREATE POLICY "early_access_insert_public" ON early_access_requests FOR INSERT WITH CHECK (true)';
  ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'early_access') THEN
    EXECUTE 'ALTER TABLE early_access ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "early_access_insert_public" ON early_access';
    EXECUTE 'CREATE POLICY "early_access_insert_public" ON early_access FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- =============================================================================
-- 3. POLÍTICAS PARA ESTUDIANTES QUE PUBLICAN PASANTÍAS
-- =============================================================================

DROP POLICY IF EXISTS "internships_select_own_student" ON internships;
CREATE POLICY "internships_select_own_student" ON internships
  FOR SELECT USING (
    company_id = auth.uid() AND public.auth_role() = 'estudiante'
  );

DROP POLICY IF EXISTS "internships_insert_student" ON internships;
CREATE POLICY "internships_insert_student" ON internships
  FOR INSERT WITH CHECK (
    company_id = auth.uid() AND public.auth_role() = 'estudiante'
  );

DROP POLICY IF EXISTS "internships_update_student" ON internships;
CREATE POLICY "internships_update_student" ON internships
  FOR UPDATE USING (
    company_id = auth.uid() AND public.auth_role() = 'estudiante'
  );

DROP POLICY IF EXISTS "internships_delete_student" ON internships;
CREATE POLICY "internships_delete_student" ON internships
  FOR DELETE USING (
    company_id = auth.uid() AND public.auth_role() = 'estudiante'
  );

-- =============================================================================
-- FIN DEL SCRIPT COMPLETO
-- =============================================================================
-- Todos los cambios de base de datos han sido aplicados correctamente.
-- Las comunidades, políticas RLS y permisos de estudiantes están listos.
-- =============================================================================
