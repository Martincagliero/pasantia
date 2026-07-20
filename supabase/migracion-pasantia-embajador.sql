-- =============================================================================
-- MIGRACIÓN: Pasantías publicadas por embajadores (empresa + imagen + permisos)
-- 1) Agrega company_name / image_url a internships (empresa a mano + imagen).
-- 2) GARANTIZA que los EMBAJADORES puedan publicar pasantías (RLS insert).
--    Sin esto, si sólo se corrió schema.sql, el embajador NO puede publicar
--    (la política internships_insert_own exige rol 'empresa') y la pasantía
--    nunca aparece en "Buscar pasantías".
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

-- 1) Columnas ----------------------------------------------------------------
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2) Función helper de rol (SECURITY DEFINER, saltea RLS -> sin recursión) ----
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

-- 3) Permitir que los embajadores publiquen / editen / borren sus pasantías ---
DROP POLICY IF EXISTS "internships_insert_ambassador" ON public.internships;
CREATE POLICY "internships_insert_ambassador" ON public.internships
  FOR INSERT WITH CHECK (company_id = auth.uid() AND public.auth_role() = 'embajador');

DROP POLICY IF EXISTS "internships_update_ambassador" ON public.internships;
CREATE POLICY "internships_update_ambassador" ON public.internships
  FOR UPDATE USING (company_id = auth.uid() AND public.auth_role() = 'embajador');

DROP POLICY IF EXISTS "internships_delete_ambassador" ON public.internships;
CREATE POLICY "internships_delete_ambassador" ON public.internships
  FOR DELETE USING (company_id = auth.uid() AND public.auth_role() = 'embajador');

-- 4) Asegurar que TODOS los autenticados vean las pasantías activas -----------
DROP POLICY IF EXISTS "internships_select_active_all" ON public.internships;
CREATE POLICY "internships_select_active_all" ON public.internships
  FOR SELECT USING (is_active = true OR company_id = auth.uid());

-- =============================================================================
-- Las pasantías del embajador aparecen tanto en su panel "Pasantías para
-- difundir" como en "Buscar pasantías" del estudiante (ambas listan internships
-- con is_active = true).
-- Verificá que tu usuario embajador tenga el rol correcto:
--   SELECT id, email, role FROM public.profiles WHERE email = 'tu@email';
--   -- si no dice 'embajador':  UPDATE public.profiles SET role='embajador' WHERE email='tu@email';
-- =============================================================================
