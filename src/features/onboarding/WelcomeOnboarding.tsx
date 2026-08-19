// Onboarding de bienvenida: aparece UNA sola vez por cuenta, apenas el usuario
// entra al panel. Muestra "cartelitos" paso a paso para activar las
// notificaciones y agregar la app a la pantalla de inicio del celular.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Loader2, Share2, Plus, Smartphone, Sparkles, X, MoreVertical, Download } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useModalGuard } from '../ui/modalGuard';
import { isPushSupported, isSubscribed, enablePush } from '../../lib/push';
import { sendPushEvent } from '../../lib/notify';
import {
  canInstall,
  promptInstall,
  onInstallAvailabilityChange,
  isRunningStandalone,
  isIos,
  isMobileDevice,
} from '../../lib/pwaInstall';
import logo from '../../assets/logo.png';

const storageKey = (uid: string) => `pasantia_onboarded_${uid}`;

function localDone(uid: string): boolean {
  try {
    return localStorage.getItem(storageKey(uid)) === '1';
  } catch {
    return false;
  }
}

function markDone(uid: string) {
  try {
    localStorage.setItem(storageKey(uid), '1');
  } catch {
    /* ignore */
  }
  // Persistencia por cuenta (best-effort; ignora si la columna no existe aún).
  void supabase
    .from('profiles')
    .update({ onboarded: true })
    .eq('id', uid)
    .then(undefined, () => undefined);
}

export function WelcomeOnboarding() {
  const { profile } = useAuth();
  const uid = profile?.id;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Decide si mostrar el onboarding (solo una vez por cuenta, solo en mobile).
  useEffect(() => {
    if (!uid) return;
    // El onboarding (agregar app a inicio + notificaciones) es solo para celulares.
    if (!isMobileDevice()) return;
    if (localDone(uid)) return;
    // Si el perfil ya viene marcado como onboarded en la DB, respetarlo.
    if ((profile as { onboarded?: boolean } | null)?.onboarded) {
      markDone(uid);
      return;
    }
    setStep(0);
    setOpen(true);
  }, [uid, profile]);

  const finish = useCallback(() => {
    if (uid) markDone(uid);
    setOpen(false);
  }, [uid]);

  if (!uid || !open) return null;

  return createPortal(
    <OnboardingModal step={step} setStep={setStep} onFinish={finish} userId={uid} />,
    document.body
  );
}

function OnboardingModal({
  step,
  setStep,
  onFinish,
  userId,
}: {
  step: number;
  setStep: (n: number) => void;
  onFinish: () => void;
  userId: string;
}) {
  const { profile } = useAuth();
  const pushSupported = useMemo(() => isPushSupported(), []);
  const ios = useMemo(() => isIos(), []);
  const standalone = useMemo(() => isRunningStandalone(), []);
  useModalGuard(true);

  const [subscribed, setSubscribed] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [installReady, setInstallReady] = useState(() => canInstall());
  const [installing, setInstalling] = useState(false);
  const [installedNow, setInstalledNow] = useState(false);

  useEffect(() => {
    if (pushSupported) void isSubscribed().then(setSubscribed);
  }, [pushSupported]);

  useEffect(() => onInstallAvailabilityChange(() => setInstallReady(canInstall())), []);

  const steps = useMemo(() => {
    const list: ('welcome' | 'notifications' | 'install')[] = ['welcome'];
    if (pushSupported) list.push('notifications');
    if (!standalone) list.push('install');
    return list;
  }, [pushSupported, standalone]);

  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  function next() {
    if (isLast) onFinish();
    else setStep(step + 1);
  }

  async function activateNotifications() {
    if (notifBusy) return;
    setNotifBusy(true);
    try {
      const res = await enablePush(userId);
      if (res === 'granted') {
        setSubscribed(true);
        void sendPushEvent('push_test', userId);
        setTimeout(next, 500);
      } else if (res === 'denied') {
        alert('Bloqueaste las notificaciones. Podés activarlas después desde los permisos del navegador.');
      } else if (res === 'no-key') {
        alert('Las notificaciones todavía no están configuradas. Probá más tarde.');
      } else if (res === 'error') {
        alert('No se pudieron activar. Probá de nuevo o más tarde desde tu perfil.');
      }
    } finally {
      setNotifBusy(false);
    }
  }

  async function installApp() {
    if (installing) return;
    setInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        setInstalledNow(true);
        setTimeout(next, 700);
      }
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:items-center sm:p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onFinish}
      />

      <div className="dash-root" data-theme="light">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="dash-panel relative w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-white/12 shadow-2xl shadow-black/40"
          >
            <button
              type="button"
              onClick={onFinish}
              aria-label="Cerrar"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Indicador de pasos */}
            <div className="flex gap-1.5 px-6 pt-6">
              {steps.map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-brand-500' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>

            <div className="px-6 pb-6 pt-5">
              {current === 'welcome' && (
                <StepShell
                  icon={<img src={logo} alt="PasantIA" className="h-9 w-9 rounded-xl" />}
                  title={`¡Hola${firstName(profile?.full_name ?? '')}! Bienvenido a PasantIA`}
                  text="En 10 segundos te dejamos todo listo para que no te pierdas ninguna oportunidad: activá las notificaciones y sumá la app a tu celular."
                >
                  <PrimaryButton onClick={next}>
                    <Sparkles className="h-[18px] w-[18px]" /> Empezar
                  </PrimaryButton>
                </StepShell>
              )}

              {current === 'notifications' && (
                <StepShell
                  icon={<Bell className="h-7 w-7 text-brand-500" />}
                  title="Activá las notificaciones"
                  text="Te avisamos al instante cuando recibís un mensaje, una solicitud de conexión o novedades en tus postulaciones."
                >
                  {subscribed ? (
                    <>
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400">
                        <Check className="h-[18px] w-[18px]" /> ¡Notificaciones activadas!
                      </div>
                      <PrimaryButton onClick={next}>Continuar</PrimaryButton>
                    </>
                  ) : (
                    <>
                      <PrimaryButton onClick={() => void activateNotifications()} disabled={notifBusy}>
                        {notifBusy ? (
                          <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        ) : (
                          <Bell className="h-[18px] w-[18px]" />
                        )}
                        Activar notificaciones
                      </PrimaryButton>
                      <GhostButton onClick={next}>Ahora no</GhostButton>
                    </>
                  )}
                </StepShell>
              )}

              {current === 'install' && (
                <StepShell
                  icon={<Smartphone className="h-7 w-7 text-brand-500" />}
                  title="Sumá PasantIA a tu inicio"
                  text={
                    ios
                      ? 'Abrí el menú Compartir y elegí “Agregar a inicio”. Vas a tener la app en pantalla completa, como cualquier otra.'
                      : 'Instalá la app para abrirla desde tu pantalla de inicio, a pantalla completa y con acceso directo.'
                  }
                >
                  {installedNow ? (
                    <>
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400">
                        <Check className="h-[18px] w-[18px]" /> ¡App agregada!
                      </div>
                      <PrimaryButton onClick={onFinish}>Listo</PrimaryButton>
                    </>
                  ) : ios ? (
                    <>
                      <ol className="space-y-2 rounded-2xl bg-white/5 p-4 text-left text-sm text-white/75">
                        <IosStep n={1} icon={<Share2 className="h-4 w-4 text-brand-500" />}>
                          Tocá <b className="text-white">Compartir</b> en la barra de Safari.
                        </IosStep>
                        <IosStep n={2} icon={<Plus className="h-4 w-4 text-brand-500" />}>
                          Elegí <b className="text-white">“Agregar a inicio”</b>.
                        </IosStep>
                        <IosStep n={3} icon={<Check className="h-4 w-4 text-brand-500" />}>
                          Confirmá y abrí PasantIA desde el ícono nuevo.
                        </IosStep>
                      </ol>
                      <PrimaryButton onClick={onFinish}>Entendido</PrimaryButton>
                    </>
                  ) : installReady ? (
                    <>
                      <PrimaryButton onClick={() => void installApp()} disabled={installing}>
                        {installing ? (
                          <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        ) : (
                          <Download className="h-[18px] w-[18px]" />
                        )}
                        Instalar app
                      </PrimaryButton>
                      <GhostButton onClick={onFinish}>Ahora no</GhostButton>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-left text-sm text-white/75">
                        <MoreVertical className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                        <span>
                          Abrí el menú del navegador (⋮) y elegí{' '}
                          <b className="text-white">“Instalar app”</b> o{' '}
                          <b className="text-white">“Agregar a pantalla principal”</b>.
                        </span>
                      </div>
                      <PrimaryButton onClick={onFinish}>Entendido</PrimaryButton>
                    </>
                  )}
                </StepShell>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function firstName(full: string): string {
  const n = full.trim().split(/\s+/)[0];
  return n ? `, ${n}` : '';
}

function StepShell({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/12">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/65">{text}</p>
      <div className="mt-6 space-y-2.5">{children}</div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold !text-white transition hover:bg-brand-400 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white/55 transition hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}

function IosStep({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold !text-white">
        {n}
      </span>
      <span className="flex items-center gap-1.5">
        {icon}
        <span>{children}</span>
      </span>
    </li>
  );
}
