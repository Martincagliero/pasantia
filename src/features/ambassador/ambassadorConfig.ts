// Configuración del Programa de Embajadores.
import type { AmbassadorOrgType } from '../../lib/database.types';

/** Puntos que otorga cada difusión. */
export const POINTS_PER_DIFFUSION = 10;

export const ORG_TYPES: { value: AmbassadorOrgType; label: string }[] = [
  { value: 'centro_estudiantes', label: 'Centro de estudiantes' },
  { value: 'agrupacion', label: 'Agrupación universitaria' },
  { value: 'secretaria_empleo', label: 'Secretaría de empleo' },
  { value: 'facultad', label: 'Facultad' },
  { value: 'carrera', label: 'Cuenta de carrera' },
  { value: 'cuenta_instagram', label: 'Cuenta de Instagram' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'otro', label: 'Otro' },
];

export function orgTypeLabel(t: AmbassadorOrgType | null | undefined): string {
  return ORG_TYPES.find((o) => o.value === t)?.label ?? 'Comunidad';
}

/** Nivel según puntos (gamificación). */
export function levelFor(points: number): { name: string; next: number | null } {
  if (points >= 500) return { name: 'Leyenda', next: null };
  if (points >= 250) return { name: 'Embajador Oro', next: 500 };
  if (points >= 100) return { name: 'Embajador Plata', next: 250 };
  if (points >= 30) return { name: 'Embajador Bronce', next: 100 };
  return { name: 'Novato', next: 30 };
}
