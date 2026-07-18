-- ============================================================================
-- PasantIA — Crear tabla de ANUNCIOS de Embajadores
-- ============================================================================
-- Embajadores pueden crear anuncios/posts con descripcion, imagen y pasantias vinculadas
-- Ejecutar en Supabase > SQL Editor (de una sola vez)

-- 1. Crear tabla de anuncios
CREATE TABLE IF NOT EXISTS public.ambassador_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid NOT NULL REFERENCES public.ambassador_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_ambassador_posts_ambassador_id ON public.ambassador_posts(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_posts_created_at ON public.ambassador_posts(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.ambassador_posts ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- El embajador puede ver y editar sus propios posts (antes de verificación)
CREATE POLICY "Embajador ve sus propios posts" ON public.ambassador_posts
  FOR SELECT
  USING (ambassador_id = auth.uid());

-- Cualquiera puede ver posts de embajadores verificados
CREATE POLICY "Público ve posts verificados" ON public.ambassador_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ambassador_profiles ap
      WHERE ap.id = ambassador_posts.ambassador_id
      AND ap.verified = true
    )
  );

-- El embajador dueño puede crear sus posts
CREATE POLICY "Embajador crea sus posts" ON public.ambassador_posts
  FOR INSERT
  WITH CHECK (ambassador_id = auth.uid());

-- El embajador dueño puede editar sus posts
CREATE POLICY "Embajador edita sus posts" ON public.ambassador_posts
  FOR UPDATE
  USING (ambassador_id = auth.uid())
  WITH CHECK (ambassador_id = auth.uid());

-- El embajador dueño puede eliminar sus posts
CREATE POLICY "Embajador elimina sus posts" ON public.ambassador_posts
  FOR DELETE
  USING (ambassador_id = auth.uid());

-- 5. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ambassador_posts_timestamp ON public.ambassador_posts;
CREATE TRIGGER update_ambassador_posts_timestamp
  BEFORE UPDATE ON public.ambassador_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Verificar que se creó
SELECT table_name FROM information_schema.tables WHERE table_name = 'ambassador_posts';
