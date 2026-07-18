-- =============================================================================
-- AGREGAR POLÍTICAS PARA QUE ESTUDIANTES PUEDAN PUBLICAR PASANTÍAS
-- Ejecutar en Supabase SQL Editor después de rls-politicas-completas.sql
-- =============================================================================

-- Estudiante puede VER sus propias pasantías (activas e inactivas)
DROP POLICY IF EXISTS "internships_select_own_student" ON internships;
CREATE POLICY "internships_select_own_student" ON internships
  FOR SELECT USING (
    company_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'estudiante')
  );

-- Estudiante puede CREAR pasantías
DROP POLICY IF EXISTS "internships_insert_student" ON internships;
CREATE POLICY "internships_insert_student" ON internships
  FOR INSERT WITH CHECK (
    company_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'estudiante')
  );

-- Estudiante puede ACTUALIZAR sus pasantías
DROP POLICY IF EXISTS "internships_update_student" ON internships;
CREATE POLICY "internships_update_student" ON internships
  FOR UPDATE USING (
    company_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'estudiante')
  );

-- Estudiante puede ELIMINAR sus pasantías
DROP POLICY IF EXISTS "internships_delete_student" ON internships;
CREATE POLICY "internships_delete_student" ON internships
  FOR DELETE USING (
    company_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'estudiante')
  );
