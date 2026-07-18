-- =============================================================================
-- MIGRACIÓN: Mensajería directa (estilo LinkedIn)
-- Ejecutar en Supabase SQL Editor.
-- =============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Ver solo los mensajes propios (enviados o recibidos)
DROP POLICY IF EXISTS "messages_select_own" ON messages;
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Enviar como uno mismo
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Marcar como leídos los mensajes recibidos
DROP POLICY IF EXISTS "messages_update_recipient" ON messages;
CREATE POLICY "messages_update_recipient" ON messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- =============================================================================
-- FIN
-- =============================================================================
