-- Solicitudes bilaterales de conexión entre estudiantes.
-- Una conexión solo entra en la red cuando el destinatario la acepta.

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS connection_requests_recipient_idx
  ON public.connection_requests(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS connection_requests_requester_idx
  ON public.connection_requests(requester_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS connection_requests_active_pair_idx
  ON public.connection_requests(
    LEAST(requester_id, recipient_id),
    GREATEST(requester_id, recipient_id)
  )
  WHERE status IN ('pending', 'accepted');

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connection_requests_select_participants" ON public.connection_requests;
CREATE POLICY "connection_requests_select_participants" ON public.connection_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "connection_requests_delete_requester" ON public.connection_requests;
CREATE POLICY "connection_requests_delete_requester" ON public.connection_requests
  FOR DELETE USING (auth.uid() = requester_id AND status = 'pending');

CREATE OR REPLACE FUNCTION public.request_connection(p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = p_recipient_id THEN
    RAISE EXCEPTION 'solicitud inválida';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'estudiante')
     OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_recipient_id AND role = 'estudiante') THEN
    RAISE EXCEPTION 'las conexiones son solo entre estudiantes';
  END IF;

  SELECT id INTO v_request_id
  FROM connection_requests
  WHERE LEAST(requester_id, recipient_id) = LEAST(auth.uid(), p_recipient_id)
    AND GREATEST(requester_id, recipient_id) = GREATEST(auth.uid(), p_recipient_id)
    AND status IN ('pending', 'accepted')
  LIMIT 1;

  IF v_request_id IS NOT NULL THEN
    RETURN v_request_id;
  END IF;

  INSERT INTO connection_requests (requester_id, recipient_id)
  VALUES (auth.uid(), p_recipient_id)
  RETURNING id INTO v_request_id;
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_connection_request(p_request_id UUID, p_accept BOOLEAN)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request connection_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM connection_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.recipient_id <> auth.uid() OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'solicitud no disponible';
  END IF;

  UPDATE connection_requests
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END,
      updated_at = now()
  WHERE id = p_request_id;

  IF p_accept THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES
      (v_request.requester_id, v_request.recipient_id),
      (v_request.recipient_id, v_request.requester_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  END IF;

  RETURN v_request.requester_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_connection(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_connection_request(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_connection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_connection_request(UUID, BOOLEAN) TO authenticated;