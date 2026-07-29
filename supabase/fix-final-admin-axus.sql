-- =============================================================================
-- FIX FINAL (con IDs exactos, ya verificados con el diagnóstico):
--   Fila 1 = c5fea4d7-f9bf-4dca-b270-82603c66611f -> cuenta DEMO de estudiante
--            (pasantia.estudiante.demo@gmail.com), marcada admin por error -> BORRAR.
--   Fila 2 = 9489bd34-2c6b-4ce9-97f9-19a7b800738e -> tu cuenta REAL de login
--            (axusanalytics@gmail.com) con datos viejos de comunidad "sss" -> LIMPIAR
--            (email/rol correctos + borrar la comunidad vieja), SIN borrar la cuenta.
-- =============================================================================

-- 1) Borrar la cuenta demo (cascada: profile, student_profiles, etc.)
DELETE FROM auth.users WHERE id = 'c5fea4d7-f9bf-4dca-b270-82603c66611f';

-- 2) Limpiar tu cuenta real: email correcto + rol neutro (estudiante)
UPDATE public.profiles
SET email = 'axusanalytics@gmail.com',
    role = 'estudiante'
WHERE id = '9489bd34-2c6b-4ce9-97f9-19a7b800738e'
RETURNING id, email, role, is_admin;

-- 3) Borrar la data vieja de comunidad ("sss") pegada a tu cuenta
DELETE FROM public.ambassador_profiles
WHERE id = '9489bd34-2c6b-4ce9-97f9-19a7b800738e';

-- 4) Verificación final: debería quedar UNA sola fila con is_admin=true (la tuya, ya limpia)
SELECT id, email, role, is_admin FROM public.profiles WHERE is_admin = true;
