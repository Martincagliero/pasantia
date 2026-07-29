-- =============================================================================
-- DIAGNÓSTICO: por qué hay más de una cuenta con is_admin = true.
-- Ejecutar SOLO esta consulta (no borra ni modifica nada) y pasar el resultado.
-- =============================================================================
SELECT
  p.id,
  u.email        AS auth_email,     -- email REAL de login (fuente de verdad)
  p.email        AS profile_email,  -- lo que quedó guardado en profiles (puede estar mal tras el UPDATE anterior)
  p.role,
  p.full_name,
  p.is_admin,
  p.created_at,
  EXISTS(SELECT 1 FROM public.student_profiles s WHERE s.id = p.id)    AS tiene_student,
  EXISTS(SELECT 1 FROM public.company_profiles c WHERE c.id = p.id)    AS tiene_company,
  EXISTS(SELECT 1 FROM public.ambassador_profiles a WHERE a.id = p.id) AS tiene_ambassador
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = true
ORDER BY p.created_at;
