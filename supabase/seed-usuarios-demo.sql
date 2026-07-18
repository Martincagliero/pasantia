-- ============================================================================
-- PasantIA — Cuentas DEMO para probar el login (estudiante + empresa)
-- ----------------------------------------------------------------------------
-- Crea 2 usuarios YA CONFIRMADOS (sin enviar emails) para poder ingresar.
-- Cómo usar:
--   1. Supabase > SQL Editor > New query
--   2. Pegá TODO este archivo y ejecutá (Run)
--   3. Ingresá en /ingresar con las credenciales del final.
--
-- Credenciales que crea:
--   Estudiante -> pasantia.estudiante.demo@gmail.com / PasantIA2025!
--   Empresa    -> pasantia.empresa.demo@gmail.com    / PasantIA2025!
-- ============================================================================

-- pgcrypto (para hashear la contraseña). En Supabase vive en el schema extensions.
create extension if not exists pgcrypto with schema extensions;

-- ---- Estudiante demo ----
do $$
declare uid uuid;
begin
  if not exists (select 1 from auth.users where email = 'pasantia.estudiante.demo@gmail.com') then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'pasantia.estudiante.demo@gmail.com',
      extensions.crypt('PasantIA2025!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Estudiante Demo","role":"estudiante"}'
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', 'pasantia.estudiante.demo@gmail.com'),
      'email', now(), now(), now()
    );
  end if;
end $$;

-- ---- Empresa demo ----
do $$
declare uid uuid;
begin
  if not exists (select 1 from auth.users where email = 'pasantia.empresa.demo@gmail.com') then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'pasantia.empresa.demo@gmail.com',
      extensions.crypt('PasantIA2025!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Empresa Demo","role":"empresa"}'
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', 'pasantia.empresa.demo@gmail.com'),
      'email', now(), now(), now()
    );
  end if;
end $$;

-- ---- Corrección obligatoria: GoTrue exige las columnas de TOKEN en '' (no NULL) ----
-- Sin esto, el login falla con 500 "Database error querying schema".
-- Solo tocamos columnas de token/cambio (NO 'phone', que es UNIQUE y debe quedar NULL).
do $$
declare
  col record;
begin
  for col in
    select column_name
    from information_schema.columns
    where table_schema = 'auth' and table_name = 'users'
      and data_type in ('character varying', 'text')
      and (column_name like '%token%' or column_name like '%change%')
      and column_name not in ('phone', 'email')
  loop
    execute format(
      'update auth.users set %I = '''' where %I is null and email in (%L, %L)',
      col.column_name, col.column_name,
      'pasantia.estudiante.demo@gmail.com', 'pasantia.empresa.demo@gmail.com'
    );
  end loop;
end $$;

-- ---- (Opcional) datos y una pasantía de ejemplo publicada por la empresa demo ----
update public.company_profiles
set company_name = 'Empresa Demo S.A.', industry = 'Tecnología', size = '11-50',
    description = 'Empresa de ejemplo para probar la plataforma.'
where id = (select id from public.profiles where email = 'pasantia.empresa.demo@gmail.com');

insert into public.internships (company_id, title, description, area, modality, location, requirements)
select p.id,
       'Pasantía en Desarrollo Frontend',
       'Sumate a nuestro equipo para construir interfaces con React. Aprendé en proyectos reales con mentoría.',
       'Tecnología', 'hibrido', 'Buenos Aires',
       'Ganas de aprender, nociones de HTML/CSS/JS. React es un plus.'
from public.profiles p
where p.email = 'pasantia.empresa.demo@gmail.com'
  and not exists (
    select 1 from public.internships i
    where i.company_id = p.id and i.title = 'Pasantía en Desarrollo Frontend'
  );

-- Fin. Ya podés ingresar con las credenciales del encabezado.
