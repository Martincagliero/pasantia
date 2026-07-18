-- ============================================================================
-- PasantIA — Crear cuenta demo de EMBAJADOR
-- ============================================================================
-- IMPORTANTE: Este script NO crea el usuario en auth.users (Supabase lo hace).
-- Solo te damos el SQL para insertar el ambassador_profiles una vez que el
-- usuario exista en Supabase auth.
--
-- PASOS:
-- 1. Ve a Supabase > Authentication > Users > Create user
--    - Email: embajador@pasantia.demo
--    - Password: (genera una segura, ej: PasantiaDemo2024!)
--    - Auto Confirm: ON
-- 2. Copia el UUID del nuevo usuario (te lo muestra en la tabla)
-- 3. Reemplaza PASTE_USER_ID_HERE abajo con ese UUID
-- 4. Ejecuta este script en Supabase > SQL Editor
-- ============================================================================

-- Actualizar raw_user_meta_data para que el rol sea 'embajador'
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"embajador"'
),
raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{full_name}',
  '"RRHH Demo - Embajador"'
)
WHERE id = 'PASTE_USER_ID_HERE';

-- Insertar el perfil de embajador
INSERT INTO public.ambassador_profiles (
  id,
  org_name,
  org_type,
  university,
  instagram_url,
  reach,
  description,
  verified,
  created_at
) VALUES (
  'PASTE_USER_ID_HERE',
  'RRHH Demo - Embajadores',
  'comunidad',
  'Demo University',
  'https://instagram.com/pasantia_demo',
  '5000+',
  'Comunidad demo para prueba del programa de embajadores de PasantIA. Aquí compartimos oportunidades laborales y pasantías para estudiantes.',
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó correctamente
SELECT id, org_name, verified, created_at FROM public.ambassador_profiles WHERE id = 'PASTE_USER_ID_HERE';
