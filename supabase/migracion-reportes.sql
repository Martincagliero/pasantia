-- =============================================================================
-- MIGRACIÓN: Reportes / denuncias (moderación)
-- Permite que cualquier usuario autenticado denuncie una pasantía, un anuncio
-- de comunidad o un perfil (empresa/estudiante/embajador). Los reportes quedan
-- privados: SOLO el dueño de la plataforma los lee desde el dashboard de Supabase.
-- Ejecutar en Supabase -> SQL Editor -> Run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Qué se reporta: 'internship' | 'community_post' | 'profile'
  target_type TEXT NOT NULL CHECK (target_type IN ('internship', 'community_post', 'profile')),
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

-- Cualquier usuario autenticado puede CREAR un reporte como sí mismo.
DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Nadie lee los reportes vía la API pública (ni el que reporta): son privados.
-- El dueño de la plataforma los revisa desde el panel de Supabase (service role),
-- que saltea RLS. Así se evita exponer denuncias entre usuarios.
-- (No se crea policy de SELECT/UPDATE/DELETE a propósito.)

-- =============================================================================
-- Consultas útiles para el dueño (ejecutar desde el SQL Editor, saltea RLS):
--   SELECT * FROM reports WHERE status = 'pendiente' ORDER BY created_at DESC;
--   UPDATE reports SET status = 'revisado' WHERE id = '...';
-- =============================================================================
