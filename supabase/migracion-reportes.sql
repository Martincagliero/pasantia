-- =============================================================================
-- MIGRACIÓN: Reportes / denuncias (moderación)
-- Permite que cualquier usuario autenticado denuncie una pasantía, un anuncio
-- de comunidad, una publicación o un perfil (empresa/estudiante/embajador). Los reportes quedan
-- privados: SOLO el dueño de la plataforma los lee desde el panel de administración.
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Qué se reporta: 'internship' | 'community_post' | 'post' | 'profile'
  target_type TEXT NOT NULL CHECK (target_type IN ('internship', 'community_post', 'post', 'profile')),
  -- ID del elemento reportado (id de la pasantía / anuncio / perfil de usuario)
  target_id UUID NOT NULL,
  -- Motivo tipificado (falsa, estafa, no es pasantia, discriminatorio, acoso, spam, ilegal, copyright, otro)
  reason TEXT NOT NULL,
  -- Detalle libre opcional
  details TEXT,
  -- Estado interno de moderación
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revisado', 'descartado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE reports ADD CONSTRAINT reports_target_type_check
  CHECK (target_type IN ('internship', 'community_post', 'post', 'profile'));

-- Cualquier usuario autenticado puede CREAR un reporte como sí mismo.
DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Nadie lee los reportes vía la API pública (ni el que reporta): son privados.
-- El dueño los revisa mediante las funciones SECURITY DEFINER de abajo,
-- que validan is_admin antes de saltear RLS.
-- (No se crea policy de SELECT/UPDATE/DELETE a propósito.)

-- Lista privada para la pestaña Denuncias del panel de administración.
CREATE OR REPLACE FUNCTION public.admin_list_reports()
RETURNS TABLE (
  id UUID,
  reporter_id UUID,
  reporter_name TEXT,
  reporter_email TEXT,
  target_type TEXT,
  target_id UUID,
  target_label TEXT,
  reason TEXT,
  details TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  RETURN QUERY
    SELECT
      report.id,
      report.reporter_id,
      COALESCE(reporter.full_name, 'Usuario') AS reporter_name,
      COALESCE(reporter.email, '') AS reporter_email,
      report.target_type,
      report.target_id,
      CASE report.target_type
        WHEN 'internship' THEN COALESCE((SELECT internship.title FROM public.internships internship WHERE internship.id = report.target_id), 'Pasantía eliminada')
        WHEN 'community_post' THEN COALESCE((SELECT LEFT(community_post.content, 100) FROM public.community_posts community_post WHERE community_post.id = report.target_id), 'Anuncio eliminado')
        WHEN 'post' THEN COALESCE((SELECT LEFT(COALESCE(NULLIF(post.title, ''), post.body), 100) FROM public.posts post WHERE post.id = report.target_id), 'Publicación eliminada')
        WHEN 'profile' THEN COALESCE((SELECT profile.full_name FROM public.profiles profile WHERE profile.id = report.target_id), 'Perfil eliminado')
        ELSE report.target_id::TEXT
      END AS target_label,
      report.reason,
      report.details,
      report.status,
      report.created_at
    FROM public.reports report
    LEFT JOIN public.profiles reporter ON reporter.id = report.reporter_id
    ORDER BY (report.status = 'pendiente') DESC, report.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_report_status(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  IF p_status NOT IN ('pendiente', 'revisado', 'descartado') THEN
    RAISE EXCEPTION 'estado inválido';
  END IF;

  UPDATE public.reports SET status = p_status WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_reports() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_report_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_reports() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_report_status(UUID, TEXT) TO authenticated;

-- =============================================================================
-- Consultas útiles para el dueño (alternativa desde el SQL Editor):
--   SELECT * FROM reports WHERE status = 'pendiente' ORDER BY created_at DESC;
--   UPDATE reports SET status = 'revisado' WHERE id = '...';
-- =============================================================================
