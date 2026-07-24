// Tracking de referidos (promotores).
// Cada promotor comparte un enlace con ?ref=SU_CODIGO. Cuando alguien entra,
// guardamos ese código en localStorage y lo adjuntamos al registrarse.
// Así podemos saber cuánta gente trajo cada promotor.

const STORAGE_KEY = 'pasantia_ref';

// Solo permitimos códigos simples (letras, números, guion y guion bajo) para
// evitar valores raros o inyecciones desde la URL.
const sanitize = (raw: string): string =>
  raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);

/**
 * Lee ?ref= (o ?promo=) de la URL y lo guarda en localStorage.
 * Llamar una vez al iniciar la app. No pisa un referido ya guardado
 * (el primero que trajo a la persona se lleva el crédito).
 */
export function captureReferral(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('ref') ?? params.get('promo') ?? '';
    const code = sanitize(raw);
    if (!code) return;
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore: si localStorage falla, seguimos sin tracking */
  }
}

/** Devuelve el código de promotor guardado (o '' si no hay). */
export function getReferral(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}
