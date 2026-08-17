-- =============================================================================
-- PasantIA: grupos de mensajes con foto, integrantes y estado de lectura.
-- Ejecutar una vez en Supabase SQL Editor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_group_members (
  group_id UUID NOT NULL REFERENCES public.message_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.message_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_group_members_user_idx
  ON public.message_group_members(user_id);
CREATE INDEX IF NOT EXISTS group_messages_group_created_idx
  ON public.group_messages(group_id, created_at DESC);

ALTER TABLE public.message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_message_group_member(p_group_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_message_group_admin(p_group_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_message_group_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_message_group_admin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_message_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_message_group_admin(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "message_groups_select_member" ON public.message_groups;
CREATE POLICY "message_groups_select_member" ON public.message_groups
  FOR SELECT USING (public.is_message_group_member(id));

DROP POLICY IF EXISTS "message_groups_update_admin" ON public.message_groups;
CREATE POLICY "message_groups_update_admin" ON public.message_groups
  FOR UPDATE USING (public.is_message_group_admin(id))
  WITH CHECK (public.is_message_group_admin(id));

DROP POLICY IF EXISTS "message_group_members_select_member" ON public.message_group_members;
CREATE POLICY "message_group_members_select_member" ON public.message_group_members
  FOR SELECT USING (public.is_message_group_member(group_id));

DROP POLICY IF EXISTS "message_group_members_update_self" ON public.message_group_members;

DROP POLICY IF EXISTS "group_messages_select_member" ON public.group_messages;
CREATE POLICY "group_messages_select_member" ON public.group_messages
  FOR SELECT USING (public.is_message_group_member(group_id));

DROP POLICY IF EXISTS "group_messages_insert_member" ON public.group_messages;
CREATE POLICY "group_messages_insert_member" ON public.group_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND public.is_message_group_member(group_id)
  );

CREATE OR REPLACE FUNCTION public.create_message_group(
  p_name TEXT,
  p_avatar_url TEXT,
  p_member_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;
  IF char_length(trim(p_name)) < 2 OR char_length(trim(p_name)) > 80 THEN
    RAISE EXCEPTION 'nombre inválido';
  END IF;
  IF COALESCE(array_length(p_member_ids, 1), 0) < 1 THEN
    RAISE EXCEPTION 'elegí al menos un integrante';
  END IF;

  INSERT INTO public.message_groups (name, avatar_url, created_by)
  VALUES (trim(p_name), NULLIF(trim(COALESCE(p_avatar_url, '')), ''), auth.uid())
  RETURNING id INTO v_group_id;

  INSERT INTO public.message_group_members (group_id, user_id, is_admin)
  VALUES (v_group_id, auth.uid(), true);

  INSERT INTO public.message_group_members (group_id, user_id, is_admin)
  SELECT v_group_id, candidate_id, false
  FROM (
    SELECT DISTINCT unnest(p_member_ids) AS candidate_id
  ) candidates
  WHERE candidate_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = candidate_id)
  ON CONFLICT DO NOTHING;

  IF (SELECT count(*) FROM public.message_group_members WHERE group_id = v_group_id) < 2 THEN
    RAISE EXCEPTION 'el grupo necesita al menos dos integrantes';
  END IF;

  RETURN v_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_message_group_read(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.message_group_members
  SET last_read_at = now()
  WHERE group_id = p_group_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no sos integrante del grupo';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_message_group(TEXT, TEXT, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_message_group_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_message_group(TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_group_read(UUID) TO authenticated;
