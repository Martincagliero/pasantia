// Onboarding de bienvenida: aparece UNA sola vez por cuenta, apenas el usuario
// entra al panel. Muestra "cartelitos" paso a paso para activar las
// notificaciones y agregar la app a la pantalla de inicio del celular.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Loader2, Share2, Plus, Smartphone, X, MoreVertical, Download, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useModalGuard } from '../ui/modalGuard';
import { isPushSupported } from '../../lib/push';
import {
  canInstall,
  promptInstall,
  onInstallAvailabilityChange,
  isRunningStandalone,
  isIos,
  isMobileDevice,
} from '../../lib/pwaInstall';
import logo from '../../assets/logo.png';

// Versión del onboarding. Al subirla, quienes ya lo vieron (incluidos los
// usuarios ya logueados) lo vuelven a ver UNA vez con la nueva guía.
const ONBOARDING_VERSION = 'v2';
const META_FLAG = `pasantia_onboarded_${ONBOARDING_VERSION}`;
const storageKey = (uid: string) => `pasantia_onboarded_${ONBOARDING_VERSION}_${uid}`;

function localDone(uid: string): boolean {
  try {
    return localStorage.getItem(storageKey(uid)) === '1';
  } catch {
    return false;
  }
}

function setLocalDone(uid: string) {
  try {
    localStorage.setItem(storageKey(uid), '1');
  } catch {
    /* ignore */
  }
}

// Marca la cuenta como "ya vio el anuncio" de forma PERMANENTE y CROSS-DEVICE.
// Guarda el flag (versionado) en localStorage (este equipo) y en el user_metadata
// de la cuenta (viaja con el usuario a cualquier dispositivo, sin migración).
// Así aparece una única vez por versión en cada cuenta.
function markDone(uid: string) {
  setLocalDone(uid);
  void supabase.auth
    .updateUser({ data: { [META_FLAG]: true } })
    .then(undefined, () => undefined);
}

export function WelcomeOnboarding() {
  const { profile, session } = useAuth();
  const uid = profile?.id;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Decide si mostrar el onboarding (una única vez por cuenta, para siempre, solo mobile).
  useEffect(() => {
    if (!uid) return;
    // El onboarding (agregar app a inicio + notificaciones) es solo para celulares.
    if (!isMobileDevice()) return;
    if (localDone(uid)) return;
    // ¿Ya vio ESTA versión en este u otro dispositivo? (flag versionado en la cuenta)
    const metaDone =
      (session?.user?.user_metadata as Record<string, unknown> | undefined)?.[META_FLAG] === true;
    if (metaDone) {
      setLocalDone(uid);
      return;
    }
    setStep(0);
    setOpen(true);
    // Se marca como visto APENAS se muestra: garantiza que aparezca una sola vez
    // para siempre, aunque cierre o recargue sin completar los pasos.
    markDone(uid);
  }, [uid, profile, session]);

  const finish = useCallback(() => {
    if (uid) markDone(uid);
    setOpen(false);
  }, [uid]);

  if (!uid || !open) return null;

  return createPortal(
    <OnboardingModal step={step} setStep={setStep} onFinish={finish} />,
    document.body
  );
}

function OnboardingModal({
  step,
  setStep,
  onFinish,
}: {
  step: number;
  setStep: (n: number) => void;
  onFinish: () => void;
}) {
  const { profile } = useAuth();
  const pushSupported = useMemo(() => isPushSupported(), []);
  const ios = useMemo(() => isIos(), []);
  const standalone = useMemo(() => isRunningStandalone(), []);
  useModalGuard(true);

  const [installReady, setInstallReady] = useState(() => canInstall());
  const [installing, setInstalling] = useState(false);
  const [installedNow, setInstalledNow] = useState(false);

  useEffect(() => onInstallAvailabilityChange(() => setInstallReady(canInstall())), []);

  const steps = useMemo(() => {
    const list: ('welcome' | 'notifications' | 'install')[] = ['welcome'];
    // Primero anclar la app al inicio (en iOS las notificaciones sólo andan ya instalada).
    if (!standalone) list.push('install');
    // Guía para activar notificaciones: SOLO instrucciones (dónde tocar), sin botón
    // que dispare el permiso del navegador. El permiso se pide desde el perfil.
    if (pushSupported) list.push('notifications');
    return list;
  }, [pushSupported, standalone]);

  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  function next() {
    if (isLast) onFinish();
    else setStep(step + 1);
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
                  text="En unos segundos te mostramos cómo dejar todo listo: primero sumá la app a tu inicio y después activá las notificaciones desde tu perfil."
                >
                  <PrimaryButton onClick={next}>Empezar</PrimaryButton>
                </StepShell>
              )}

              {current === 'notifications' && (
                <StepShell
                  icon={<Bell className="h-8 w-8 text-white/80" strokeWidth={1.5} />}
                  title="Después, activá las notificaciones"
                  text="Cuando quieras, activalas para enterarte al instante de mensajes, solicitudes de conexión y novedades en tus postulaciones."
                >
                  <ol className="space-y-2.5 rounded-2xl border border-white/10 p-4 text-left text-sm text-white/70">
                    <IosStep n={1} icon={<UserRound className="h-4 w-4 text-white/60" strokeWidth={1.5} />}>
                      Tocá tu <b className="font-semibold text-white">foto de perfil</b> arriba a la derecha.
                    </IosStep>
                    <IosStep n={2} icon={<Bell className="h-4 w-4 text-white/60" strokeWidth={1.5} />}>
                      Elegí <b className="font-semibold text-white">“Activar notificaciones”</b> en el menú.
                    </IosStep>
                  </ol>
                  <PrimaryButton onClick={next}>Entendido</PrimaryButton>
                </StepShell>
              )}

              {current === 'install' && (
                <StepShell
                  icon={<Smartphone className="h-8 w-8 text-white/80" strokeWidth={1.5} />}
                  title="Sumá PasantIA a tu inicio"
                  text={
                    ios
                      ? 'Abrí el menú Compartir y elegí “Agregar a inicio”. Vas a tener la app en pantalla completa, como cualquier otra.'
                      : 'Instalá la app para abrirla desde tu pantalla de inicio, a pantalla completa y con acceso directo.'
                  }
                >
                  {installedNow ? (
                    <>
                      <p className="flex items-center justify-center gap-2 py-1 text-sm font-medium text-white/80">
                        <Check className="h-[18px] w-[18px]" strokeWidth={1.5} /> App agregada
                      </p>
                      <PrimaryButton onClick={next}>Continuar</PrimaryButton>
                    </>
                  ) : ios ? (
                    <>
                      <ol className="space-y-2.5 rounded-2xl border border-white/10 p-4 text-left text-sm text-white/70">
                        <IosStep n={1} icon={<Share2 className="h-4 w-4 text-white/60" strokeWidth={1.5} />}>
                          Tocá <b className="font-semibold text-white">Compartir</b> en la barra de Safari.
                        </IosStep>
                        <IosStep n={2} icon={<Plus className="h-4 w-4 text-white/60" strokeWidth={1.5} />}>
                          Deslizá y elegí <b className="font-semibold text-white">“Agregar a inicio”</b>.
                        </IosStep>
                        <IosStep n={3} icon={<Check className="h-4 w-4 text-white/60" strokeWidth={1.5} />}>
                          Tocá <b className="font-semibold text-white">Agregar</b> y abrí PasantIA desde el ícono nuevo.
                        </IosStep>
                        <IosStep n={4} icon={<Bell className="h-4 w-4 text-white/60" strokeWidth={1.5} />}>
                          Ya en la app, activá las <b className="font-semibold text-white">notificaciones</b> desde tu perfil.
                        </IosStep>
                      </ol>
                      <p className="text-xs leading-relaxed text-white/45">
                        En iPhone las notificaciones sólo funcionan con la app agregada al inicio.
                      </p>
                      <PrimaryButton onClick={next}>Entendido</PrimaryButton>
                    </>
                  ) : installReady ? (
                    <>
                      <PrimaryButton onClick={() => void installApp()} disabled={installing}>
                        {installing ? (
                          <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        ) : (
                          <Download className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        )}
                        Instalar app
                      </PrimaryButton>
                      <GhostButton onClick={next}>Ahora no</GhostButton>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 rounded-2xl border border-white/10 p-4 text-left text-sm text-white/70">
                        <MoreVertical className="mt-0.5 h-5 w-5 shrink-0 text-white/60" strokeWidth={1.5} />
                        <span>
                          Abrí el menú del navegador (⋮) y elegí{' '}
                          <b className="font-semibold text-white">“Instalar app”</b> o{' '}
                          <b className="font-semibold text-white">“Agregar a pantalla principal”</b>.
                        </span>
                      </div>
                      <PrimaryButton onClick={next}>Entendido</PrimaryButton>
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
      <div className="mx-auto flex h-14 w-14 items-center justify-center">{icon}</div>
      <h2 className="mt-3 text-xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">{text}</p>
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
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 text-xs font-semibold text-white/70">
        {n}
      </span>
      <span className="flex items-center gap-1.5">
        {icon}
        <span>{children}</span>
      </span>
    </li>
  );
}
