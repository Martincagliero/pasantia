-- ============================================================================
-- PasantIA — Migración: LinkedIn + Portfolio + subida de CV como archivo
-- ----------------------------------------------------------------------------
-- Corré esto UNA vez en Supabase > SQL Editor > Run.
-- Agrega columnas al perfil de estudiante y habilita el bucket de CVs.
-- ============================================================================

-- 1) Nuevas columnas en el perfil del estudiante
alter table public.student_profiles add column if not exists linkedin_url text;
alter table public.student_profiles add column if not exists portfolio_url text;

-- 2) Bucket de CVs público (para que las empresas puedan abrir el archivo)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do update set public = true;

-- 3) Políticas de Storage: cada estudiante gestiona su carpeta (uid/...)
drop policy if exists "cv_insert_own" on storage.objects;
create policy "cv_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cv_update_own" on storage.objects;
create policy "cv_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cv_delete_own" on storage.objects;
create policy "cv_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Lectura pública de los CVs
drop policy if exists "cv_read_public" on storage.objects;
create policy "cv_read_public" on storage.objects
  for select using (bucket_id = 'cvs');

-- Fin de la migración.
