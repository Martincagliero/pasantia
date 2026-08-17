// Botón para activar/desactivar las notificaciones push en este dispositivo.
// Se muestra dentro del menú "Cuenta" del panel.
import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { isPushSupported, isSubscribed, enablePush, disablePush } from '../../lib/push';
import { sendPushEvent } from '../../lib/notify';

export function NotificationsButton({ variant = 'menu' }: { variant?: 'menu' | 'card' }) {
  const { profile } = useAuth();
  const [supported] = useState(() => isPushSupported());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!supported) return;
    isSubscribed().then(setSubscribed);
  }, [supported]);

  if (!supported) return null;

  async function toggle() {
    if (!profile?.id || busy) return;
    setBusy(true);
    try {
      if (subscribed) {
        await disablePush();
        setSubscribed(false);
      } else {
        const res = await enablePush(profile.id);
        if (res === 'granted') {
          setSubscribed(true);
          void sendPushEvent('push_test', profile.id);
        } else if (res === 'denied') {
          alert('Bloqueaste las notificaciones. Activalas desde los permisos del navegador para este sitio.');
        } else if (res === 'no-key') {
          alert('Faltan configurar las claves de notificaciones (VITE_VAPID_PUBLIC_KEY).');
        } else if (res === 'error') {
          alert('No se pudieron activar las notificaciones. Probá de nuevo.');
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function testPush() {
    if (!profile?.id || testing) return;
    setTesting(true);
    const accepted = await sendPushEvent('push_test', profile.id);
    setTesting(false);
    if (!accepted) alert('No pudimos enviar la prueba. Volvé a activar las notificaciones.');
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={busy}
        className={
          variant === 'card'
            ? 'flex w-full items-center gap-3 rounded-xl bg-brand-500 px-4 py-3 text-left text-sm font-semibold !text-white transition hover:bg-brand-400 disabled:opacity-60 sm:w-auto'
            : 'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-60'
        }
      >
        {busy ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : subscribed ? (
          <BellOff className="h-[18px] w-[18px]" />
        ) : (
          <Bell className="h-[18px] w-[18px]" />
        )}
        {subscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
      </button>
      {subscribed && variant === 'menu' && (
        <button
          type="button"
          onClick={() => void testPush()}
          disabled={testing}
          className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-brand-500 transition hover:bg-white/[0.06] disabled:opacity-60"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Probar notificación
        </button>
      )}
    </div>
  );
}
