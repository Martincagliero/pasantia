-- ============================================================================
-- PasantIA — Schema del sistema interno (estudiantes + empresas + matching)
-- ----------------------------------------------------------------------------
-- Cómo usar:
--   1. Entrá a tu proyecto en https://supabase.com
--   2. SQL Editor > New query
--   3. Pegá TODO este archivo y ejecutá (Run)
--   4. Copiá URL y anon key desde Project Settings > API a tu .env.local
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Tipos enumerados
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('estudiante', 'empresa');
exception when duplicate_object then null; end $$;
alter type user_role add value if not exists 'embajador';

do $$ begin
  create type application_status as enum ('pendiente', 'vista', 'aceptada', 'rechazada');
exception when duplicate_object then null; end $$;
-- Estados ampliados (candidatos):
alter type application_status add value if not exists 'en_revision';
alter type application_status add value if not exists 'entrevista';
alter type application_status add value if not exists 'prueba_tecnica';
alter type application_status add value if not exists 'seleccionado';

do $$ begin
  create type internship_modality as enum ('presencial', 'remoto', 'hibrido');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- profiles: 1 fila por usuario autenticado. Guarda el rol.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null,
  full_name  text not null default '',
  email      text not null default '',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- student_profiles: datos extra del estudiante
-- ----------------------------------------------------------------------------
create table if not exists public.student_profiles (
  id           uuid primary key references public.profiles(id) on delete cascade,
  university   text,
  career       text,
  year         text,
  area         text,
  skills       text[],
  availability text,
  bio          text,
  cv_url       text,
  linkedin_url text,
  portfolio_url text,
  phone        text,
  location     text,
  gpa          text,
  transcript_url text,
  github_url   text,
  is_public    boolean not null default false
);
-- Por si la tabla ya existía sin estas columnas:
alter table public.student_profiles add column if not exists linkedin_url text;
alter table public.student_profiles add column if not exists portfolio_url text;
alter table public.student_profiles add column if not exists phone text;
alter table public.student_profiles add column if not exists location text;
alter table public.student_profiles add column if not exists gpa text;
alter table public.student_profiles add column if not exists transcript_url text;
alter table public.student_profiles add column if not exists github_url text;
alter table public.student_profiles add column if not exists instagram_url text;
alter table public.student_profiles add column if not exists is_public boolean not null default false;

-- ----------------------------------------------------------------------------
-- company_profiles: datos extra de la empresa
-- ----------------------------------------------------------------------------
create table if not exists public.company_profiles (
  id           uuid primary key references public.profiles(id) on delete cascade,
  company_name text,
  industry     text,
  size         text,
  website      text,
  description  text
);

-- ----------------------------------------------------------------------------
-- internships: pasantías publicadas por empresas
-- ----------------------------------------------------------------------------
create table if not exists public.internships (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text not null,
  area         text not null,
  modality     internship_modality not null default 'presencial',
  location     text,
  requirements text,
  company_name text,
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists internships_company_idx on public.internships(company_id);
create index if not exists internships_active_idx on public.internships(is_active);

-- ----------------------------------------------------------------------------
-- applications: postulaciones de estudiantes a pasantías
-- ----------------------------------------------------------------------------
create table if not exists public.applications (
  id            uuid primary key default uuid_generate_v4(),
  internship_id uuid not null references public.internships(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  status        application_status not null default 'pendiente',
  message       text,
  created_at    timestamptz not null default now(),
  unique (internship_id, student_id) -- un estudiante no postula dos veces a la misma
);
alter table public.applications add column if not exists is_favorite boolean not null default false;
create index if not exists applications_internship_idx on public.applications(internship_id);
create index if not exists applications_student_idx on public.applications(student_id);

-- ============================================================================
-- Trigger: al crear un usuario en auth.users, crear su profile + subtabla
-- usando los metadatos enviados en el signUp (role, full_name).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role user_role;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'estudiante')::user_role;

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  );

  if v_role = 'estudiante' then
    insert into public.student_profiles (id) values (new.id);
  elsif v_role = 'empresa' then
    insert into public.company_profiles (id) values (new.id);
  elsif v_role = 'embajador' then
    insert into public.ambassador_profiles (id, org_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.student_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.internships      enable row level security;
alter table public.applications     enable row level security;

-- Helper: rol del usuario actual
create or replace function public.auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

-- ---- profiles ----
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Las empresas pueden ver el profile de estudiantes que se postularon a SUS pasantías.
drop policy if exists "profiles_select_applicants" on public.profiles;
create policy "profiles_select_applicants" on public.profiles
  for select using (
    exists (
      select 1
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where a.student_id = profiles.id
        and i.company_id = auth.uid()
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- student_profiles ----
drop policy if exists "student_select_own" on public.student_profiles;
create policy "student_select_own" on public.student_profiles
  for select using (auth.uid() = id);

drop policy if exists "student_select_applicants" on public.student_profiles;
create policy "student_select_applicants" on public.student_profiles
  for select using (
    exists (
      select 1
      from public.applications a
      join public.internships i on i.id = a.internship_id
      where a.student_id = student_profiles.id
        and i.company_id = auth.uid()
    )
  );

drop policy if exists "student_upsert_own" on public.student_profiles;
create policy "student_upsert_own" on public.student_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Directorio de talento (opt-in): empresas ven perfiles marcados como públicos.
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

-- ---- company_profiles ----
-- Cualquier usuario autenticado puede ver datos básicos de empresas (para las pasantías).
drop policy if exists "company_select_all" on public.company_profiles;
create policy "company_select_all" on public.company_profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "company_update_own" on public.company_profiles;
create policy "company_update_own" on public.company_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- internships ----
-- Estudiantes ven las activas; empresas ven las suyas (activas o no).
drop policy if exists "internships_select" on public.internships;
create policy "internships_select" on public.internships
  for select using (
    is_active = true or company_id = auth.uid()
  );

drop policy if exists "internships_insert_own" on public.internships;
create policy "internships_insert_own" on public.internships
  for insert with check (
    company_id = auth.uid() and public.auth_role() = 'empresa'
  );

drop policy if exists "internships_update_own" on public.internships;
create policy "internships_update_own" on public.internships
  for update using (company_id = auth.uid()) with check (company_id = auth.uid());

drop policy if exists "internships_delete_own" on public.internships;
create policy "internships_delete_own" on public.internships
  for delete using (company_id = auth.uid());

-- ---- applications ----
-- El estudiante ve sus postulaciones; la empresa ve las de sus pasantías.
drop policy if exists "applications_select" on public.applications;
create policy "applications_select" on public.applications
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.internships i
      where i.id = applications.internship_id and i.company_id = auth.uid()
    )
  );

-- Solo estudiantes postulan, y solo a nombre propio.
drop policy if exists "applications_insert_student" on public.applications;
create policy "applications_insert_student" on public.applications
  for insert with check (
    student_id = auth.uid() and public.auth_role() = 'estudiante'
  );

-- El estudiante puede retirar su postulación; la empresa puede cambiar el estado.
drop policy if exists "applications_update" on public.applications;
create policy "applications_update" on public.applications
  for update using (
    student_id = auth.uid()
    or exists (
      select 1 from public.internships i
      where i.id = applications.internship_id and i.company_id = auth.uid()
    )
  );

drop policy if exists "applications_delete_student" on public.applications;
create policy "applications_delete_student" on public.applications
  for delete using (student_id = auth.uid());

-- Pasantías guardadas (favoritos del estudiante)
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

-- ============================================================================
-- Programa de Embajadores (comunidades que difunden pasantías)
-- ============================================================================
create table if not exists public.ambassador_profiles (
  id            uuid primary key references public.profiles(id) on delete cascade,
  org_name      text,
  org_type      text,
  university    text,
  instagram_url text,
  reach         text,
  description   text,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.internship_broadcasts (
  internship_id uuid not null references public.internships(id) on delete cascade,
  ambassador_id uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (internship_id, ambassador_id)
);

create table if not exists public.internship_diffusions (
  ambassador_id uuid not null references public.profiles(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (ambassador_id, internship_id)
);

create or replace function public.protect_ambassador_verified()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then new.verified := old.verified; end if;
  return new;
end;
$$;
drop trigger if exists ambassador_protect_verified on public.ambassador_profiles;
create trigger ambassador_protect_verified
  before update on public.ambassador_profiles
  for each row execute function public.protect_ambassador_verified();

alter table public.ambassador_profiles    enable row level security;
alter table public.internship_broadcasts  enable row level security;
alter table public.internship_diffusions  enable row level security;

drop policy if exists "amb_select_all" on public.ambassador_profiles;
create policy "amb_select_all" on public.ambassador_profiles
  for select using (auth.role() = 'authenticated');
drop policy if exists "amb_update_own" on public.ambassador_profiles;
create policy "amb_update_own" on public.ambassador_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "bc_select" on public.internship_broadcasts;
create policy "bc_select" on public.internship_broadcasts
  for select using (
    ambassador_id = auth.uid()
    or exists (select 1 from public.internships i where i.id = internship_id and i.company_id = auth.uid())
  );
drop policy if exists "bc_insert_company" on public.internship_broadcasts;
create policy "bc_insert_company" on public.internship_broadcasts
  for insert with check (
    exists (select 1 from public.internships i where i.id = internship_id and i.company_id = auth.uid())
  );
drop policy if exists "bc_delete_company" on public.internship_broadcasts;
create policy "bc_delete_company" on public.internship_broadcasts
  for delete using (
    exists (select 1 from public.internships i where i.id = internship_id and i.company_id = auth.uid())
  );

drop policy if exists "df_select_all" on public.internship_diffusions;
create policy "df_select_all" on public.internship_diffusions
  for select using (auth.role() = 'authenticated');
drop policy if exists "df_insert_own" on public.internship_diffusions;
create policy "df_insert_own" on public.internship_diffusions
  for insert with check (ambassador_id = auth.uid() and public.auth_role() = 'embajador');
drop policy if exists "df_delete_own" on public.internship_diffusions;
create policy "df_delete_own" on public.internship_diffusions
  for delete using (ambassador_id = auth.uid());

-- ============================================================================
-- Panel de Novedades: posts que publican estudiantes y empresas
-- ============================================================================
do $$ begin
  create type post_category as enum ('novedad', 'proyecto', 'busqueda', 'recurso');
exception when duplicate_object then null; end $$;

create table if not exists public.posts (
  id          uuid primary key default uuid_generate_v4(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default '',
  author_role user_role not null,
  title       text not null,
  body        text not null,
  category    post_category not null default 'novedad',
  link_url    text,
  created_at  timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_author_idx on public.posts(author_id);

alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts
  for select using (auth.role() = 'authenticated');

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (author_id = auth.uid());

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete using (author_id = auth.uid());

-- ============================================================================
-- Storage: bucket para CVs (subida de archivo desde el perfil del estudiante)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do update set public = true;

-- El estudiante sube/actualiza su CV solo dentro de su propia carpeta (uid/...).
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

-- Lectura pública de los CVs (bucket público) para que las empresas puedan verlos.
drop policy if exists "cv_read_public" on storage.objects;
create policy "cv_read_public" on storage.objects
  for select using (bucket_id = 'cvs');

-- Fin del schema.
