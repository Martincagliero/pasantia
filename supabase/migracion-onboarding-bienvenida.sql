-- Onboarding de bienvenida: marca si el usuario ya vio los cartelitos iniciales
-- (activar notificaciones + agregar la app a inicio). Aparece UNA sola vez por cuenta.
-- Correr en el SQL Editor de Supabase.

alter table public.profiles
  add column if not exists onboarded boolean not null default false;

-- Nota: no hace falta tocar RLS. La policy de UPDATE propia existente
-- (id = auth.uid()) ya permite al usuario marcar su propio onboarding.
