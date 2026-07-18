-- =============================================================================
-- FIX: "infinite recursion detected in policy for relation profiles"
-- =============================================================================
-- Síntoma: al iniciar sesión, la app no puede leer el perfil (profiles) y cae
-- en el rol por defecto (estudiante), aunque en la base el rol sea correcto.
--
-- Causa: varias políticas RLS de `internships` consultan `profiles` con un
-- subselect inline  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() ...).
-- Como las políticas de `profiles` a su vez leen `internships`, se forma un
-- ciclo profiles -> internships -> profiles y Postgres aborta con recursión.
--
-- Solución: usar la función SECURITY DEFINER public.auth_role() (que saltea
-- RLS) en lugar del subselect a profiles. Así se rompe el ciclo.
-- Ejecutar TODO esto en Supabase -> SQL Editor -> Run.
-- =============================================================================

-- 1) Helper SECURITY DEFINER (idempotente)
create or replace function public.auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- 2) Reescribir las políticas de internships que consultaban profiles inline.

-- ---- Embajador ----
drop policy if exists "internships_insert_ambassador" on public.internships;
create policy "internships_insert_ambassador" on public.internships
  for insert with check (company_id = auth.uid() and public.auth_role() = 'embajador');

drop policy if exists "internships_update_ambassador" on public.internships;
create policy "internships_update_ambassador" on public.internships
  for update using (company_id = auth.uid() and public.auth_role() = 'embajador');

drop policy if exists "internships_delete_ambassador" on public.internships;
create policy "internships_delete_ambassador" on public.internships
  for delete using (company_id = auth.uid() and public.auth_role() = 'embajador');

-- ---- Estudiante (la SELECT era la que disparaba la recursión al leer profiles) ----
drop policy if exists "internships_select_own_student" on public.internships;
create policy "internships_select_own_student" on public.internships
  for select using (company_id = auth.uid() and public.auth_role() = 'estudiante');

drop policy if exists "internships_insert_student" on public.internships;
create policy "internships_insert_student" on public.internships
  for insert with check (company_id = auth.uid() and public.auth_role() = 'estudiante');

drop policy if exists "internships_update_student" on public.internships;
create policy "internships_update_student" on public.internships
  for update using (company_id = auth.uid() and public.auth_role() = 'estudiante');

drop policy if exists "internships_delete_student" on public.internships;
create policy "internships_delete_student" on public.internships
  for delete using (company_id = auth.uid() and public.auth_role() = 'estudiante');

-- =============================================================================
-- Verificación: esto debería devolver TU rol sin error de recursión.
--   select role from public.profiles where id = auth.uid();
-- =============================================================================
