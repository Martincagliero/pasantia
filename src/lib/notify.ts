// Solicita notificaciones push mediante eventos verificables. La Edge Function
// autentica al emisor y deriva destinatarios, texto y URL desde la base.
import { supabase } from './supabase';

export type PushEventType =
  | 'message'
  | 'connection_request'
  | 'connection_accepted'
  | 'post'
  | 'internship'
  | 'member';

/**
 * Solicita un push a partir de un evento real de la base. La Edge Function
 * autentica al emisor, valida el recurso y deriva destinatarios y contenido.
 */
export async function sendPushEvent(
  eventType: PushEventType,
  resourceId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: { event_type: eventType, resource_id: resourceId },
    });
    if (error) {
      console.warn('[push] send-push event error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[push] send-push event excepción:', error);
    return false;
  }
}
