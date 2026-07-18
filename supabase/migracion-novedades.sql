-- ============================================================================
-- PasantIA — Migración: Panel de Novedades (posts de estudiantes y empresas)
-- ----------------------------------------------------------------------------
-- Corré esto UNA vez en Supabase > SQL Editor > Run.
-- Crea la tabla `posts` para que estudiantes y empresas publiquen novedades,
-- proyectos, búsquedas y recursos, visibles para todos los usuarios logueados.
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

-- Todos los usuarios autenticados pueden leer las publicaciones.
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts
  for select using (auth.role() = 'authenticated');

-- Cada usuario publica a nombre propio.
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (author_id = auth.uid());

-- Cada usuario edita / borra solo sus publicaciones.
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete using (author_id = auth.uid());

-- Fin de la migración.
