-- =============================================================================
-- MIGRACIÓN: Pasantías publicadas por embajadores (empresa + imagen)
-- Cuando un embajador publica una pasantía, no tiene company_profile propio,
-- así que se guarda el nombre de la empresa a mano (company_name) y, opcional,
-- una imagen (image_url). Estas columnas también sirven para las pasantías de
-- empresas (quedan en NULL y se usa el join a company_profiles).
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS image_url TEXT;

-- =============================================================================
-- Las pasantías del embajador ya aparecen tanto en su panel "Pasantías para
-- difundir" como en "Buscar pasantías" del estudiante porque ambas listan
-- todas las internships con is_active = true. No se requieren cambios de RLS
-- (la policy de insert para embajadores ya existe en migracion-fix-rls-recursion.sql).
-- =============================================================================
