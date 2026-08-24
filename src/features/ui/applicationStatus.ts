// Configuración central de los estados de una postulación/candidato.
// Un solo lugar para etiquetas, iconos y orden; se usa en toda la app.
import type { LucideIcon } from 'lucide-react';
import { Circle, Search, MessagesSquare, ClipboardCheck, CircleCheck, CircleX } from 'lucide-react';

export type AppStatus =
  | 'pendiente' // Nuevo
  | 'en_revision'
  | 'entrevista'
  | 'prueba_tecnica'
  | 'seleccionado'
  | 'rechazada';

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
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
    icon: Circle,
  },
  en_revision: {
    label: 'En revisión',
    icon: Search,
  },
  entrevista: {
    label: 'Entrevista',
    icon: MessagesSquare,
  },
  prueba_tecnica: {
    label: 'Prueba técnica',
    icon: ClipboardCheck,
  },
  seleccionado: {
    label: 'Seleccionado',
    icon: CircleCheck,
  },
  rechazada: {
    label: 'Rechazado',
    icon: CircleX,
  },
};

/** Normaliza estados antiguos (vista/aceptada) al set nuevo. */
export function normalizeStatus(s: string): AppStatus {
  if (s === 'vista') return 'en_revision';
  if (s === 'aceptada') return 'seleccionado';
  if ((STATUS_ORDER as string[]).includes(s)) return s as AppStatus;
  return 'pendiente';
}
