-- =============================================================================
-- PasantIA: administración segura de grupos de mensajes.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_message_group_avatar(
  p_group_id UUID,
  p_avatar_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_message_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'solo un administrador puede cambiar la imagen';
  END IF;

  UPDATE public.message_groups
  SET avatar_url = NULLIF(trim(COALESCE(p_avatar_url, '')), ''),
      updated_at = now()
  WHERE id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'grupo inexistente';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_message_group_name(
  p_group_id UUID,
  p_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_message_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'solo un administrador puede cambiar el nombre';
  END IF;
  IF char_length(trim(COALESCE(p_name, ''))) < 2
     OR char_length(trim(COALESCE(p_name, ''))) > 80 THEN
    RAISE EXCEPTION 'el nombre debe tener entre 2 y 80 caracteres';
  END IF;

  UPDATE public.message_groups
  SET name = trim(p_name),
      updated_at = now()
  WHERE id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'grupo inexistente';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_message_group_member(
  p_group_id UUID,
  p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_member_count INTEGER;
BEGIN
  IF NOT public.is_message_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'solo un administrador puede quitar integrantes';
  END IF;

  SELECT created_by INTO v_creator_id
  FROM public.message_groups
  WHERE id = p_group_id;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'grupo inexistente';
  END IF;
  IF p_member_id = v_creator_id THEN
    RAISE EXCEPTION 'no se puede quitar al creador del grupo';
  END IF;

  SELECT count(*) INTO v_member_count
  FROM public.message_group_members
  WHERE group_id = p_group_id;

  IF v_member_count <= 2 THEN
    RAISE EXCEPTION 'el grupo debe conservar al menos dos integrantes';
  END IF;

  DELETE FROM public.message_group_members
  WHERE group_id = p_group_id AND user_id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'el integrante no pertenece al grupo';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_message_group_avatar(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_message_group_name(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_message_group_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_message_group_avatar(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_message_group_name(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_message_group_member(UUID, UUID) TO authenticated;
