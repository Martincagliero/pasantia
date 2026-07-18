-- =============================================================================
-- STORAGE POLICIES — bucket "cvs"
-- Ejecutar en Supabase SQL Editor
-- Permite a usuarios autenticados subir y leer archivos del bucket "cvs"
-- =============================================================================

-- Subir cualquier archivo (CVs, logos, imágenes de anuncios)
DROP POLICY IF EXISTS "cvs_insert_authenticated" ON storage.objects;
CREATE POLICY "cvs_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cvs');

-- Leer cualquier archivo del bucket
DROP POLICY IF EXISTS "cvs_select_authenticated" ON storage.objects;
CREATE POLICY "cvs_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cvs');

-- Actualizar sus propios archivos
DROP POLICY IF EXISTS "cvs_update_own" ON storage.objects;
CREATE POLICY "cvs_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cvs' AND owner = auth.uid());

-- Eliminar sus propios archivos
DROP POLICY IF EXISTS "cvs_delete_own" ON storage.objects;
CREATE POLICY "cvs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cvs' AND owner = auth.uid());

-- =============================================================================
-- FIN
-- =============================================================================
