// Dispara una notificación push a un usuario, llamando a la Edge Function
// "send-push" de Supabase. Es best-effort: si falla, no rompe el flujo.
import { supabase } from './supabase';

export async function sendPush(params: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  try {
    await supabase.functions.invoke('send-push', {
      body: {
        user_id: params.userId,
        title: params.title,
        body: params.body,
        url: params.url ?? '/app',
      },
    });
  } catch {
    /* si la función no está desplegada todavía, ignoramos el error */
  }
}
