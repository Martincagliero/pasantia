-- ============================================================================
-- PasantIA — Migración: estados de candidato ampliados + favoritos de RRHH
-- ----------------------------------------------------------------------------
-- Corré esto UNA vez en Supabase > SQL Editor > Run.
-- Agrega nuevos estados de postulación y una marca de "favorito" para la empresa.
-- ============================================================================

-- IMPORTANTE: Ejecutá estas líneas UNA POR UNA en Supabase SQL Editor
-- (cada una en su propia ejecución - copia/pega una línea, Run, copia/pega la siguiente)
-- Supabase no permite ALTER TYPE dentro de transacciones.
--
-- Nuevos valores del enum de estado (los antiguos pendiente/vista/aceptada/rechazada
-- siguen existiendo; la app los normaliza en pantalla):

-- 1) Ejecutá esto primero:
-- alter type application_status add value if not exists 'en_revision';

-- 2) Luego esto:
-- alter type application_status add value if not exists 'entrevista';

-- 3) Luego esto:
-- alter type application_status add value if not exists 'prueba_tecnica';

-- 4) Luego esto:
-- alter type application_status add value if not exists 'seleccionado';

-- Marca de favorito (estrella) que gestiona la empresa.
alter table public.applications add column if not exists is_favorite boolean not null default false;

-- Fin de la migración.
