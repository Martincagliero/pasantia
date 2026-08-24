-- Publicaciones sociales: texto libre, imagenes y menciones.
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_images_limit;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_images_limit
  CHECK (cardinality(image_urls) <= 4);

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_mentions_array;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_mentions_array
  CHECK (jsonb_typeof(mentions) = 'array');