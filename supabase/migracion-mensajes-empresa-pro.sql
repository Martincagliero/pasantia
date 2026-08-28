-- Mensajería interna para empresas: exclusiva de planes Pro/Empresa activos.
-- Las empresas Gratis conservan acceso de lectura y pueden contactar por email.

CREATE OR REPLACE FUNCTION public.can_message(p_sender UUID, p_recipient UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_sender = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles sender
    WHERE sender.id = p_sender AND (
      sender.role = 'embajador'
      OR public.current_plan(p_sender) IN ('pro', 'enterprise')
      OR (sender.role = 'estudiante' AND (
        EXISTS (
          SELECT 1 FROM public.messages m
          WHERE (m.sender_id = p_sender AND m.recipient_id = p_recipient)
             OR (m.sender_id = p_recipient AND m.recipient_id = p_sender)
        )
        OR EXISTS (
          SELECT 1 FROM public.follows f1
          JOIN public.follows f2
            ON f2.follower_id = f1.following_id
           AND f2.following_id = f1.follower_id
          WHERE f1.follower_id = p_sender AND f1.following_id = p_recipient
        )
      ))
    )
  );
$$;

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
DROP POLICY IF EXISTS messages_insert_freemium ON public.messages;
CREATE POLICY messages_insert_freemium ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND public.can_message(sender_id, recipient_id)
  );