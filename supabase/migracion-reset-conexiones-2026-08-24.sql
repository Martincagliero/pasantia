-- Reinicia el uso de conexiones Gratis para todos desde este instante.
-- Las solicitudes anteriores se conservan, pero no consumen el cupo mensual.
-- Ejecutar en Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.request_connection(p_recipient_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR p_recipient_id = auth.uid()
    OR public.auth_role() <> 'estudiante'
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND role = 'estudiante') THEN
    RAISE EXCEPTION 'CONNECTION_NOT_ALLOWED';
  END IF;

  SELECT id INTO v_id FROM public.connection_requests
  WHERE LEAST(requester_id, recipient_id) = LEAST(auth.uid(), p_recipient_id)
    AND GREATEST(requester_id, recipient_id) = GREATEST(auth.uid(), p_recipient_id)
    AND status IN ('pending', 'accepted')
  LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  IF public.current_plan(auth.uid()) = 'free' THEN
    SELECT count(*) INTO v_count FROM public.connection_requests
    WHERE requester_id = auth.uid()
      AND created_at >= GREATEST(
        date_trunc('month', now()),
        TIMESTAMPTZ '2026-08-24 00:09:25-03'
      );
    IF v_count >= 5 THEN RAISE EXCEPTION 'FREE_CONNECTION_MONTHLY_LIMIT'; END IF;
  END IF;

  INSERT INTO public.connection_requests(requester_id, recipient_id)
  VALUES (auth.uid(), p_recipient_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;