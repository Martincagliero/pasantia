-- =============================================================================
-- FIX: la cuenta admin (axusanalytics@gmail.com) tiene pegada una data vieja
-- de comunidad/embajador ("SSS") en su propia fila de profiles. "Mi perfil"
-- termina mostrando eso en vez de un perfil limpio.
-- Ejecutar en el SQL Editor de Supabase, PASO A PASO (revisá cada resultado
-- antes de seguir al siguiente paso).
-- =============================================================================

-- 1) Ver la fila real (deberia ser una sola, la de is_admin = true)
SELECT id, email, role, full_name, is_admin FROM public.profiles WHERE is_admin = true;

-- =============================================================================
-- Revisá que el "id" de arriba sea el único resultado. Si hay más de uno,
-- PARÁ y avisame antes de seguir.
-- =============================================================================

-- 2) Corregir el email y sacarle el rol de embajador (queda como estudiante,
--    rol neutro; el acceso al panel de admin NO depende de esto, depende de is_admin).
UPDATE public.profiles
SET email = 'axusanalytics@gmail.com',
    role = 'estudiante'
WHERE is_admin = true
RETURNING id, email, role, is_admin;

-- 3) Borrar la data vieja de comunidad ("SSS") asociada a esa cuenta.
DELETE FROM public.ambassador_profiles
WHERE id = (SELECT id FROM public.profiles WHERE is_admin = true);

-- 4) Verificación final
SELECT id, email, role, is_admin FROM public.profiles WHERE is_admin = true;
SELECT * FROM public.ambassador_profiles
WHERE id = (SELECT id FROM public.profiles WHERE is_admin = true);
-- Este último SELECT debería devolver 0 filas.
-- =============================================================================
