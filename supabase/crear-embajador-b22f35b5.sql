-- ============================================================================
-- PasantIA — Crear cuenta de EMBAJADOR DEMO
-- ============================================================================
-- UID: b22f35b5-9ba6-419c-9627-1141a6aaeaa8
-- Ejecutar en Supabase > SQL Editor > Run

-- Actualizar el rol del usuario a embajador
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"embajador"'
)
WHERE id = 'b22f35b5-9ba6-419c-9627-1141a6aaeaa8';

-- Insertar perfil de embajador
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
  'b22f35b5-9ba6-419c-9627-1141a6aaeaa8',
  'Demo Ambassadors - PasantIA',
  'comunidad',
  'Demo University',
  'https://instagram.com/pasantia_demo',
  '5000+',
  'Cuenta de prueba para el programa de embajadores. Aquí compartimos oportunidades y pasantías verificadas.',
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó correctamente
SELECT id, org_name, verified, created_at FROM public.ambassador_profiles WHERE id = 'b22f35b5-9ba6-419c-9627-1141a6aaeaa8';
