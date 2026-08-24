-- Registra la versión y fecha de aceptación de los términos por cada perfil.
-- Ejecutar una vez en Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Recupera aceptaciones ya guardadas en metadata durante el registro.
UPDATE public.profiles profile
SET
  terms_accepted_at = COALESCE(
    profile.terms_accepted_at,
    CASE
      WHEN COALESCE(auth_user.raw_user_meta_data ->> 'terms_accepted_at', '')
        ~ '^\d{4}-\d{2}-\d{2}T'
      THEN (auth_user.raw_user_meta_data ->> 'terms_accepted_at')::TIMESTAMPTZ
      ELSE NULL
    END
  ),
  terms_version = COALESCE(
    profile.terms_version,
    auth_user.raw_user_meta_data ->> 'terms_version'
  )
FROM auth.users auth_user
WHERE auth_user.id = profile.id;