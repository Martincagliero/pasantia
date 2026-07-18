-- ============================================================================
-- PasantIA — Migración: Programa de Embajadores Universitarios
-- ----------------------------------------------------------------------------
-- Nuevo tipo de cuenta "embajador" (comunidades, centros de estudiantes,
-- cuentas de Instagram, facultades, etc.), verificación por admin, difusión
-- de pasantías y puntos por difundir.
--
-- IMPORTANTE: Ejecutá esto PRIMERO en una consulta separada:
-- alter type user_role add value if not exists 'embajador';
-- (Los ALTER TYPE no pueden ir dentro de transacciones)
-- ============================================================================

-- 1) Nuevo rol (ejecutado por separado arriba)

-- 2) Perfil de embajador / comunidad
create table if not exists public.ambassador_profiles (
  id            uuid primary key references public.profiles(id) on delete cascade,
  org_name      text,
  org_type      text,          -- centro_estudiantes | agrupacion | secretaria_empleo | facultad | carrera | cuenta_instagram | comunidad | otro
  university    text,
  instagram_url text,
  reach         text,          -- alcance / seguidores aprox (texto libre)
  description   text,
  verified      boolean not null default false, -- lo valida el admin
  created_at    timestamptz not null default now()
);

-- 3) Difusión elegida por la empresa (a qué comunidades dirige una pasantía)
create table if not exists public.internship_broadcasts (
  internship_id uuid not null references public.internships(id) on delete cascade,
  ambassador_id uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (internship_id, ambassador_id)
);

-- 4) Difusiones hechas por el embajador (fuente de puntos)
create table if not exists public.internship_diffusions (
  ambassador_id uuid not null references public.profiles(id) on delete cascade,
  internship_id uuid not null references public.internships(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (ambassador_id, internship_id)
);

-- 5) Trigger de alta: incluir el rol embajador
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
    new.id, v_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  );

  if v_role = 'estudiante' then
    insert into public.student_profiles (id) values (new.id);
  elsif v_role = 'empresa' then
    insert into public.company_profiles (id) values (new.id);
  elsif v_role = 'embajador' then
    insert into public.ambassador_profiles (id, org_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  end if;

  return new;
end;
$$;

-- 6) Protección: los embajadores NO pueden auto-verificarse por la API.
--    (auth.uid() es NULL en el SQL Editor => el admin sí puede validar.)
create or replace function public.protect_ambassador_verified()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.verified := old.verified;
  end if;
  return new;
end;
$$;

drop trigger if exists ambassador_protect_verified on public.ambassador_profiles;
create trigger ambassador_protect_verified
  before update on public.ambassador_profiles
  for each row execute function public.protect_ambassador_verified();

-- 7) RLS
alter table public.ambassador_profiles    enable row level security;
alter table public.internship_broadcasts  enable row level security;
alter table public.internship_diffusions  enable row level security;

-- ambassador_profiles: todos los logueados los ven (empresas los eligen, ranking).
drop policy if exists "amb_select_all" on public.ambassador_profiles;
create policy "amb_select_all" on public.ambassador_profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "amb_update_own" on public.ambassador_profiles;
create policy "amb_update_own" on public.ambassador_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- internship_broadcasts: la empresa dueña gestiona; el embajador ve las suyas.
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

-- internship_diffusions: lectura pública (ranking); el embajador crea/borra las suyas.
drop policy if exists "df_select_all" on public.internship_diffusions;
create policy "df_select_all" on public.internship_diffusions
  for select using (auth.role() = 'authenticated');

drop policy if exists "df_insert_own" on public.internship_diffusions;
create policy "df_insert_own" on public.internship_diffusions
  for insert with check (ambassador_id = auth.uid() and auth.role() = 'authenticated');

drop policy if exists "df_delete_own" on public.internship_diffusions;
create policy "df_delete_own" on public.internship_diffusions
  for delete using (ambassador_id = auth.uid());

-- Fin de la migración.
