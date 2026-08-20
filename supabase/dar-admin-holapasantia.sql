-- =============================================================================
-- Dar acceso de ADMIN a la cuenta holapasantia@gmail.com
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de migracion-admin.sql
-- (esa migración crea la columna profiles.is_admin y las funciones de admin).
-- =============================================================================

-- Por las dudas, aseguramos que exista la columna is_admin.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar como admin. Buscamos el id tanto por profiles.email como por el email
-- real de la cuenta en auth.users (por si el profile quedó sin email cargado).
UPDATE public.profiles p
SET is_admin = TRUE
WHERE lower(p.email) = 'holapasantia@gmail.com'
   OR p.id IN (
     SELECT u.id FROM auth.users u
     WHERE lower(u.email) = 'holapasantia@gmail.com'
   );

-- Verificación: debería listar la cuenta holapasantia con is_admin = true.
SELECT p.id, p.email, p.role, p.is_admin
FROM public.profiles p
WHERE p.is_admin = TRUE;
