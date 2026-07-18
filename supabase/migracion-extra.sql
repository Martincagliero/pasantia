-- ============================================================================
-- PasantIA — Migración EXTRA: analítico/notas, más datos del estudiante,
-- pasantías guardadas (favoritos) y directorio de talento (opt-in).
-- ----------------------------------------------------------------------------
-- Corré esto UNA vez en Supabase > SQL Editor > Run.
-- ============================================================================

-- 1) Nuevas columnas en el perfil del estudiante
alter table public.student_profiles add column if not exists phone          text;
alter table public.student_profiles add column if not exists location       text;
alter table public.student_profiles add column if not exists gpa            text;   -- promedio
alter table public.student_profiles add column if not exists transcript_url text;   -- analítico / notas (archivo)
alter table public.student_profiles add column if not exists github_url     text;
alter table public.student_profiles add column if not exists is_public      boolean not null default false;

-- 2) Directorio de talento (opt-in): las empresas pueden ver los perfiles
--    de estudiantes que marcaron "perfil visible".
drop policy if exists "student_select_public" on public.student_profiles;
create policy "student_select_public" on public.student_profiles
  for select using (is_public = true);

drop policy if exists "profiles_select_public_students" on public.profiles;
create policy "profiles_select_public_students" on public.profiles
  for select using (
    role = 'estudiante' and exists (
      select 1 from public.student_profiles sp
      where sp.id = profiles.id and sp.is_public = true
    )
  );

-- 3) Pasantías guardadas (favoritos del estudiante)
create table if not exists public.saved_internships (
  student_id    uuid not null references public.profiles(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (student_id, internship_id)
);
alter table public.saved_internships enable row level security;

drop policy if exists "saved_select_own" on public.saved_internships;
create policy "saved_select_own" on public.saved_internships
  for select using (student_id = auth.uid());

drop policy if exists "saved_insert_own" on public.saved_internships;
create policy "saved_insert_own" on public.saved_internships
  for insert with check (student_id = auth.uid() and public.auth_role() = 'estudiante');

drop policy if exists "saved_delete_own" on public.saved_internships;
create policy "saved_delete_own" on public.saved_internships
  for delete using (student_id = auth.uid());

-- El analítico se sube al MISMO bucket 'cvs' (ya público, en la carpeta del uid),
-- así que no hacen falta nuevas políticas de storage.

-- Fin de la migración.
