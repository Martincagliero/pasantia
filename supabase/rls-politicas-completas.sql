-- =============================================================================
-- RLS POLÍTICAS COMPLETAS — PasantIA
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Es seguro re-ejecutar: usa DROP IF EXISTS antes de cada CREATE.
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLA: profiles (datos básicos de cualquier usuario)
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- TABLA: student_profiles
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- TABLA: company_profiles
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- TABLA: ambassador_profiles
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- TABLA: internships (pasantías publicadas por empresas)
-- ─────────────────────────────────────────────
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede VER pasantías activas
DROP POLICY IF EXISTS "internships_select_active" ON internships;
CREATE POLICY "internships_select_active" ON internships
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Empresa ve todas las suyas (activas e inactivas)
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


-- ─────────────────────────────────────────────
-- TABLA: applications (postulaciones de estudiantes)
-- ─────────────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Estudiante ve sus propias postulaciones
DROP POLICY IF EXISTS "applications_select_student" ON applications;
CREATE POLICY "applications_select_student" ON applications
  FOR SELECT USING (student_id = auth.uid());

-- Empresa ve postulaciones a SUS pasantías
DROP POLICY IF EXISTS "applications_select_company" ON applications;
CREATE POLICY "applications_select_company" ON applications
  FOR SELECT USING (
    internship_id IN (
      SELECT id FROM internships WHERE company_id = auth.uid()
    )
  );

-- Estudiante puede postularse (INSERT)
DROP POLICY IF EXISTS "applications_insert_student" ON applications;
CREATE POLICY "applications_insert_student" ON applications
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Estudiante puede retirar su postulación (DELETE)
DROP POLICY IF EXISTS "applications_delete_student" ON applications;
CREATE POLICY "applications_delete_student" ON applications
  FOR DELETE USING (student_id = auth.uid());

-- Empresa puede cambiar el estado (status, is_favorite)
DROP POLICY IF EXISTS "applications_update_company" ON applications;
CREATE POLICY "applications_update_company" ON applications
  FOR UPDATE USING (
    internship_id IN (
      SELECT id FROM internships WHERE company_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- TABLA: saved_internships (pasantías guardadas)
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- TABLA: ambassador_posts (anuncios de embajadores)
-- ─────────────────────────────────────────────
ALTER TABLE ambassador_posts ENABLE ROW LEVEL SECURITY;

-- Embajador ve sus propios posts
DROP POLICY IF EXISTS "posts_select_own" ON ambassador_posts;
CREATE POLICY "posts_select_own" ON ambassador_posts
  FOR SELECT USING (ambassador_id = auth.uid());

-- Cualquier autenticado ve posts de embajadores verificados
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


-- ─────────────────────────────────────────────
-- TABLA: early_access_requests (registro público)
-- Nota: solo agregar si esta tabla existe en tu proyecto.
-- Si el nombre es distinto, ajustarlo aquí.
-- ─────────────────────────────────────────────
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
-- FIN DEL SCRIPT
-- =============================================================================
