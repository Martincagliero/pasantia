// Captura el evento `beforeinstallprompt` (Android / Chrome de escritorio) apenas
// dispara el navegador, para poder ofrecer un botón "Instalar app" más tarde.
// En iOS este evento no existe: ahí se instala manualmente (Compartir → Agregar a inicio).

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

/** ¿Hay un prompt de instalación nativo disponible (Android/Chrome)? */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

/** Lanza el prompt nativo de instalación. Devuelve true si el usuario aceptó. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
    return choice.outcome === 'accepted';
  } catch {
    return false;
  }
}

/** Suscribe a cambios de disponibilidad del prompt. Devuelve la función para desuscribir. */
export function onInstallAvailabilityChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** ¿La app ya está corriendo instalada (pantalla completa / agregada a inicio)? */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    // iOS Safari expone navigator.standalone
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Detecta iPhone / iPad para mostrar las instrucciones de "Agregar a inicio". */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
}

/** True si es un dispositivo móvil (celular/tablet): por user agent o pantalla táctil chica. */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const uaMobile = /android|iphone|ipad|ipod|iemobile|blackberry|opera mini|mobile/i.test(
    navigator.userAgent
  );
  const smallTouch =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)')?.matches === true &&
    window.innerWidth <= 1024;
  return uaMobile || smallTouch;
}

