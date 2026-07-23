-- ============================================================================
-- PasantIA — SEED DEMO COMPLETO (perfiles + pasantías + novedades)
-- ----------------------------------------------------------------------------
-- QUÉ HACE ESTE ARCHIVO:
--   1) Crea cuentas DEMO ya confirmadas (empresas, estudiantes, embajador) con
--      foto/logo. Todas están CLARAMENTE marcadas con "(DEMO)".
--   2) BORRA TODAS las pasantías existentes y crea pasantías DEMO con imágenes.
--   3) BORRA TODAS las novedades (posts) y crea novedades DEMO.
--
-- ⚠️  ADVERTENCIA: los pasos 2 y 3 ELIMINAN todos los datos actuales de
--     pasantías y novedades (incluye postulaciones, guardadas y difusiones
--     asociadas por CASCADE). Ejecutá esto solo si querés dejar la plataforma
--     con datos de demostración limpios.
--
-- CÓMO USAR:
--   Supabase > SQL Editor > New query > pegar TODO > Run.
--
-- CREDENCIALES (todas con la misma contraseña):  PasantIA2025!
--   Empresa    -> pasantia.demo.technova@gmail.com
--   Empresa    -> pasantia.demo.mercadoandes@gmail.com
--   Empresa    -> pasantia.demo.marketing@gmail.com
--   Estudiante -> pasantia.demo.valentina@gmail.com
--   Estudiante -> pasantia.demo.mateo@gmail.com
--   Embajador  -> pasantia.demo.embajador@gmail.com
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helper temporal: crea un usuario confirmado en auth.users (si no existe) y
-- devuelve su UUID. La contraseña es siempre PasantIA2025!.
-- ---------------------------------------------------------------------------
create or replace function public.demo_create_user(p_email text, p_name text, p_role text)
returns uuid language plpgsql security definer as $fn$
declare uid uuid;
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      p_email, extensions.crypt('PasantIA2025!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', p_name, 'role', p_role)
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', p_email),
      'email', now(), now(), now()
    );
  end if;
  return uid;
end $fn$;

-- ---------------------------------------------------------------------------
-- 1) LIMPIEZA: borrar TODAS las pasantías y novedades actuales.
--    TRUNCATE ... CASCADE limpia también postulaciones/guardadas/difusiones.
-- ---------------------------------------------------------------------------
truncate table public.internships cascade;
delete from public.posts;

-- ---------------------------------------------------------------------------
-- 2) Crear cuentas DEMO + perfiles + pasantías + novedades.
-- ---------------------------------------------------------------------------
do $$
declare
  c_tech uuid;
  c_mkt  uuid;
  c_shop uuid;
  s_val  uuid;
  s_mat  uuid;
  a_utn  uuid;
begin
  -- ===== EMPRESAS =====
  c_tech := public.demo_create_user('pasantia.demo.technova@gmail.com',    'TechNova (DEMO)',       'empresa');
  c_mkt  := public.demo_create_user('pasantia.demo.marketing@gmail.com',   'Impulso Marketing (DEMO)', 'empresa');
  c_shop := public.demo_create_user('pasantia.demo.mercadoandes@gmail.com','Mercado Andes (DEMO)',  'empresa');

  -- ===== ESTUDIANTES =====
  s_val := public.demo_create_user('pasantia.demo.valentina@gmail.com', 'Valentina Gómez (DEMO)',  'estudiante');
  s_mat := public.demo_create_user('pasantia.demo.mateo@gmail.com',     'Mateo Fernández (DEMO)',  'estudiante');

  -- ===== EMBAJADOR =====
  a_utn := public.demo_create_user('pasantia.demo.embajador@gmail.com', 'Comunidad Ing. UTN (DEMO)', 'embajador');

  -- ---- profiles (por si el trigger no corrió) ----
  insert into public.profiles (id, role, full_name, email) values
    (c_tech, 'empresa',    'TechNova (DEMO)',          'pasantia.demo.technova@gmail.com'),
    (c_mkt,  'empresa',    'Impulso Marketing (DEMO)', 'pasantia.demo.marketing@gmail.com'),
    (c_shop, 'empresa',    'Mercado Andes (DEMO)',     'pasantia.demo.mercadoandes@gmail.com'),
    (s_val,  'estudiante', 'Valentina Gómez (DEMO)',   'pasantia.demo.valentina@gmail.com'),
    (s_mat,  'estudiante', 'Mateo Fernández (DEMO)',   'pasantia.demo.mateo@gmail.com'),
    (a_utn,  'embajador',  'Comunidad Ing. UTN (DEMO)','pasantia.demo.embajador@gmail.com')
  on conflict (id) do update
    set role = excluded.role, full_name = excluded.full_name, email = excluded.email;

  -- ---- company_profiles ----
  insert into public.company_profiles (id, avatar_url, company_name, industry, size, website, description, verified) values
    (c_tech,
     'https://ui-avatars.com/api/?name=TechNova&background=0A66C2&color=fff&size=256&bold=true',
     'TechNova (DEMO)', 'Software y Tecnología', '51-200', 'https://example.com',
     '⚠️ Cuenta DEMO de ejemplo. Empresa de software que desarrolla productos digitales y busca sumar jóvenes talentos.', true),
    (c_mkt,
     'https://ui-avatars.com/api/?name=Impulso&background=7C3AED&color=fff&size=256&bold=true',
     'Impulso Marketing (DEMO)', 'Marketing y Publicidad', '11-50', 'https://example.com',
     '⚠️ Cuenta DEMO de ejemplo. Agencia de marketing digital especializada en redes sociales y contenido.', true),
    (c_shop,
     'https://ui-avatars.com/api/?name=Mercado+Andes&background=059669&color=fff&size=256&bold=true',
     'Mercado Andes (DEMO)', 'E-commerce y Retail', '201-500', 'https://example.com',
     '⚠️ Cuenta DEMO de ejemplo. Plataforma de comercio electrónico líder en la región.', true)
  on conflict (id) do update set
    avatar_url = excluded.avatar_url, company_name = excluded.company_name,
    industry = excluded.industry, size = excluded.size, website = excluded.website,
    description = excluded.description, verified = excluded.verified;

  -- ---- student_profiles (públicos y verificados para que se vean en Explorar) ----
  insert into public.student_profiles
    (id, avatar_url, university, career, year, area, skills, availability, bio, location, phone, linkedin_url, instagram_url, is_public, verified)
  values
    (s_val,
     'https://i.pravatar.cc/400?img=47',
     'Universidad de Buenos Aires (UBA)', 'Lic. en Sistemas de Información', '4° año', 'Tecnología',
     array['React','TypeScript','Node.js','SQL','Git'], 'Part-time (medio día)',
     '⚠️ Perfil DEMO de ejemplo. Estudiante de sistemas apasionada por el desarrollo web y la experiencia de usuario.',
     'CABA, Argentina', '+54 9 11 5555-1234', 'https://linkedin.com/in/demo', '@valentina.demo', true, true),
    (s_mat,
     'https://i.pravatar.cc/400?img=13',
     'Universidad Tecnológica Nacional (UTN)', 'Ing. Industrial', '3° año', 'Operaciones',
     array['Excel','Power BI','Gestión de proyectos','Lean'], 'Full-time',
     '⚠️ Perfil DEMO de ejemplo. Estudiante de ingeniería industrial interesado en mejora de procesos y logística.',
     'Córdoba, Argentina', '+54 9 351 555-6789', 'https://linkedin.com/in/demo', '@mateo.demo', true, true)
  on conflict (id) do update set
    avatar_url = excluded.avatar_url, university = excluded.university, career = excluded.career,
    year = excluded.year, area = excluded.area, skills = excluded.skills, availability = excluded.availability,
    bio = excluded.bio, location = excluded.location, phone = excluded.phone,
    linkedin_url = excluded.linkedin_url, instagram_url = excluded.instagram_url,
    is_public = excluded.is_public, verified = excluded.verified;

  -- ---- ambassador_profiles (verificado para poder difundir) ----
  insert into public.ambassador_profiles
    (id, org_name, org_type, university, instagram_url, reach, description, logo_url, verified)
  values
    (a_utn, 'Comunidad Ing. UTN (DEMO)', 'comunidad', 'Universidad Tecnológica Nacional (UTN)',
     '@comunidad.utn.demo', '5000+',
     '⚠️ Comunidad DEMO de ejemplo. Difundimos oportunidades de pasantías entre estudiantes de ingeniería.',
     'https://ui-avatars.com/api/?name=UTN&background=DC2626&color=fff&size=256&bold=true', true)
  on conflict (id) do update set
    org_name = excluded.org_name, org_type = excluded.org_type, university = excluded.university,
    instagram_url = excluded.instagram_url, reach = excluded.reach, description = excluded.description,
    logo_url = excluded.logo_url, verified = excluded.verified;

  -- ---- PASANTÍAS DEMO (con imágenes) ----
  insert into public.internships
    (company_id, title, description, area, modality, location, requirements, image_url, is_active)
  values
    (c_tech,
     'Pasantía en Desarrollo Frontend (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Sumate a nuestro equipo para construir interfaces con React y TypeScript. Vas a trabajar en proyectos reales con mentoría de desarrolladores senior.',
     'Tecnología', 'hibrido', 'Buenos Aires',
     'Conocimientos de HTML, CSS y JavaScript. React es un plus. Ganas de aprender.',
     'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80', true),
    (c_tech,
     'Pasantía en QA / Testing (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Aprendé a asegurar la calidad de productos digitales realizando pruebas manuales y automatizadas.',
     'Tecnología', 'remoto', 'Remoto',
     'Atención al detalle. Nociones de programación deseables. Inglés técnico.',
     'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80', true),
    (c_mkt,
     'Pasantía en Community Management (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Gestioná las redes sociales de nuestras marcas: creación de contenido, calendarios y análisis de métricas.',
     'Marketing', 'presencial', 'Rosario',
     'Manejo de Instagram y TikTok. Redacción creativa. Canva o herramientas de diseño.',
     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80', true),
    (c_mkt,
     'Pasantía en Diseño Gráfico (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Diseñá piezas para campañas digitales y material de marca junto a nuestro equipo creativo.',
     'Diseño', 'hibrido', 'Buenos Aires',
     'Manejo de Figma / Adobe. Portfolio con trabajos. Creatividad.',
     'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&q=80', true),
    (c_shop,
     'Pasantía en Análisis de Datos (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Trabajá con datos de ventas y clientes para generar reportes e insights de negocio.',
     'Datos', 'hibrido', 'Buenos Aires',
     'Excel avanzado. SQL o Power BI deseable. Pensamiento analítico.',
     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80', true),
    (c_shop,
     'Pasantía en Logística y Operaciones (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Colaborá en la coordinación de envíos, stock y mejora de procesos operativos.',
     'Operaciones', 'presencial', 'Córdoba',
     'Estudiante de Ing. Industrial o afín. Excel. Organización.',
     'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80', true),
    (c_tech,
     'Pasantía en Soporte Técnico (DEMO)',
     '⚠️ Pasantía DEMO de ejemplo. Brindá soporte a usuarios y aprendé sobre sistemas, redes y atención al cliente.',
     'Tecnología', 'remoto', 'Remoto',
     'Buena comunicación. Conocimientos básicos de informática. Paciencia.',
     'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&q=80', true);

  -- ---- NOVEDADES (posts) DEMO ----
  insert into public.posts (author_id, author_name, author_role, title, body, category, link_url)
  values
    (c_tech, 'TechNova (DEMO)', 'empresa',
     '[DEMO] Abrimos búsqueda de pasantes de desarrollo',
     '⚠️ Publicación DEMO de ejemplo. Estamos buscando estudiantes de sistemas para sumarse a nuestro equipo de frontend. ¡Postulate desde la sección de pasantías!',
     'busqueda', null),
    (c_mkt, 'Impulso Marketing (DEMO)', 'empresa',
     '[DEMO] Tips para armar tu portfolio creativo',
     '⚠️ Publicación DEMO de ejemplo. Compartimos algunos consejos para que tu portfolio destaque cuando te postulás a una pasantía de diseño o marketing.',
     'recurso', 'https://www.behance.net'),
    (a_utn, 'Comunidad Ing. UTN (DEMO)', 'embajador',
     '[DEMO] Charla: cómo conseguir tu primera pasantía',
     '⚠️ Publicación DEMO de ejemplo. Este viernes hacemos una charla abierta con recomendaciones para dar tus primeros pasos en el mundo laboral.',
     'novedad', null),
    (s_val, 'Valentina Gómez (DEMO)', 'estudiante',
     '[DEMO] Proyecto final: app de gestión de tareas',
     '⚠️ Publicación DEMO de ejemplo. Comparto el proyecto que desarrollé con React y Supabase para la materia de Programación.',
     'proyecto', 'https://github.com'),
    (s_mat, 'Mateo Fernández (DEMO)', 'estudiante',
     '[DEMO] Busco pasantía en operaciones o logística',
     '⚠️ Publicación DEMO de ejemplo. Estudiante de Ing. Industrial (3° año) disponible full-time. ¡Cualquier recomendación es bienvenida!',
     'busqueda', null);
end $$;

-- ---------------------------------------------------------------------------
-- 3) Corrección obligatoria de GoTrue: columnas de token en '' (no NULL).
--    Sin esto, el login de las cuentas nuevas falla con error 500.
-- ---------------------------------------------------------------------------
do $$
declare col record;
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
      'update auth.users set %I = '''' where %I is null and email like %L',
      col.column_name, col.column_name, 'pasantia.demo.%@gmail.com'
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Limpieza del helper temporal.
-- ---------------------------------------------------------------------------
drop function if exists public.demo_create_user(text, text, text);

-- ============================================================================
-- LISTO. Todas las cuentas usan la contraseña: PasantIA2025!
-- Las pasantías, novedades y perfiles quedaron marcados como (DEMO).
-- ============================================================================
