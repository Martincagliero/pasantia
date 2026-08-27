-- El check de perfil identifica un plan pago activo, no una validacion manual.
-- Gratis: sin check. Pro/Empresa/Premium activo: check PRO.

DROP FUNCTION IF EXISTS public.admin_list_verifications();
DROP FUNCTION IF EXISTS public.admin_set_profile_verification(uuid, boolean);

CREATE OR REPLACE FUNCTION public.sync_profile_verified_with_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_verified boolean;
BEGIN
  v_verified := NEW.plan IN ('pro', 'enterprise')
    AND (NEW.plan_expires_at IS NULL OR NEW.plan_expires_at > now());

  IF NEW.role = 'estudiante' THEN
    UPDATE public.student_profiles SET verified = v_verified WHERE id = NEW.id;
  ELSIF NEW.role = 'empresa' THEN
    UPDATE public.company_profiles SET verified = v_verified WHERE id = NEW.id;
  ELSIF NEW.role = 'embajador' THEN
    UPDATE public.ambassador_profiles SET verified = v_verified WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_verified_plan ON public.profiles;
CREATE TRIGGER sync_profile_verified_plan
  AFTER INSERT OR UPDATE OF plan, plan_expires_at ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verified_with_plan();

UPDATE public.student_profiles target
SET verified = source.plan IN ('pro', 'enterprise')
  AND (source.plan_expires_at IS NULL OR source.plan_expires_at > now())
FROM public.profiles source
WHERE source.id = target.id;

UPDATE public.company_profiles target
SET verified = source.plan IN ('pro', 'enterprise')
  AND (source.plan_expires_at IS NULL OR source.plan_expires_at > now())
FROM public.profiles source
WHERE source.id = target.id;

UPDATE public.ambassador_profiles target
SET verified = source.plan IN ('pro', 'enterprise')
  AND (source.plan_expires_at IS NULL OR source.plan_expires_at > now())
FROM public.profiles source
WHERE source.id = target.id;

-- Las comunidades no dependen del campo legado para ser visibles.
DROP POLICY IF EXISTS "ambassador_profiles_select_verified" ON public.ambassador_profiles;
DROP POLICY IF EXISTS "amb_select_all" ON public.ambassador_profiles;
CREATE POLICY "amb_select_all" ON public.ambassador_profiles
  FOR SELECT USING (true);

DO $$
BEGIN
  IF to_regclass('public.ambassador_posts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Público ve posts verificados" ON public.ambassador_posts;
    DROP POLICY IF EXISTS "posts_select_verified_ambassadors" ON public.ambassador_posts;
    DROP POLICY IF EXISTS "Público ve posts de embajadores" ON public.ambassador_posts;
    CREATE POLICY "Público ve posts de embajadores" ON public.ambassador_posts
      FOR SELECT USING (true);
  END IF;
END;
$$;