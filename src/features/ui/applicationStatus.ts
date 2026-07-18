// Configuración central de los estados de una postulación/candidato.
// Un solo lugar para etiquetas, colores y orden; se usa en toda la app.
export type AppStatus =
  | 'pendiente' // Nuevo
  | 'en_revision'
  | 'entrevista'
  | 'prueba_tecnica'
  | 'seleccionado'
  | 'rechazada';

export interface StatusMeta {
  label: string;
  emoji: string;
  /** color del punto */
  dot: string;
  /** clases del badge (borde + fondo + texto) */
  badge: string;
  /** clases del botón activo */
  active: string;
}

export const STATUS_ORDER: AppStatus[] = [
  'pendiente',
  'en_revision',
  'entrevista',
  'prueba_tecnica',
  'seleccionado',
  'rechazada',
];

export const STATUS_META: Record<AppStatus, StatusMeta> = {
  pendiente: {
    label: 'Nuevo',
    emoji: '🟢',
    dot: 'bg-emerald-400',
    badge: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200',
    active: 'border-emerald-300 bg-emerald-400 text-emerald-950',
  },
  en_revision: {
    label: 'En revisión',
    emoji: '🟡',
    dot: 'bg-amber-400',
    badge: 'border-amber-300/30 bg-amber-400/15 text-amber-200',
    active: 'border-amber-300 bg-amber-400 text-amber-950',
  },
  entrevista: {
    label: 'Entrevista',
    emoji: '🟠',
    dot: 'bg-orange-400',
    badge: 'border-orange-300/30 bg-orange-400/15 text-orange-200',
    active: 'border-orange-300 bg-orange-400 text-orange-950',
  },
  prueba_tecnica: {
    label: 'Prueba técnica',
    emoji: '🔵',
    dot: 'bg-sky-400',
    badge: 'border-sky-300/30 bg-sky-400/15 text-sky-200',
    active: 'border-sky-300 bg-sky-400 text-sky-950',
  },
  seleccionado: {
    label: 'Seleccionado',
    emoji: '🟣',
    dot: 'bg-violet-400',
    badge: 'border-violet-300/30 bg-violet-400/15 text-violet-200',
    active: 'border-violet-300 bg-violet-400 text-violet-950',
  },
  rechazada: {
    label: 'Rechazado',
    emoji: '🔴',
    dot: 'bg-red-400',
    badge: 'border-red-300/30 bg-red-400/15 text-red-200',
    active: 'border-red-300 bg-red-400 text-red-950',
  },
};

/** Normaliza estados antiguos (vista/aceptada) al set nuevo. */
export function normalizeStatus(s: string): AppStatus {
  if (s === 'vista') return 'en_revision';
  if (s === 'aceptada') return 'seleccionado';
  if ((STATUS_ORDER as string[]).includes(s)) return s as AppStatus;
  return 'pendiente';
}
