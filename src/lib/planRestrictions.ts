export type PlanRestrictionCode =
  | 'student_connections'
  | 'student_applications'
  | 'company_posts'
  | 'student_messages'
  | 'company_messages';

export interface PlanRestriction {
  code: PlanRestrictionCode;
  title: string;
  message: string;
  action: string;
}

const RESTRICTIONS: Record<PlanRestrictionCode, PlanRestriction> = {
  student_connections: {
    code: 'student_connections',
    title: 'No te quedan conexiones gratis este mes',
    message: 'El plan Gratis incluye hasta 5 conexiones nuevas por mes. Estudiante Pro permite conectar sin límite.',
    action: 'Solicitar Estudiante Pro',
  },
  student_applications: {
    code: 'student_applications',
    title: 'No te quedan postulaciones gratis este mes',
    message: 'El plan Gratis incluye hasta 5 postulaciones por mes. Estudiante Pro permite postularte sin límite.',
    action: 'Solicitar Estudiante Pro',
  },
  company_posts: {
    code: 'company_posts',
    title: 'No te quedan publicaciones gratis este mes',
    message: 'El plan Gratis incluye hasta 3 pasantías por mes. Empresa Pro permite publicar sin límite.',
    action: 'Solicitar Empresa Pro',
  },
  student_messages: {
    code: 'student_messages',
    title: 'Necesitás una conexión aceptada',
    message: 'Con el plan Gratis podés escribir a estudiantes conectados. Estudiante Pro permite enviar mensajes sin conexión previa.',
    action: 'Solicitar Estudiante Pro',
  },
  company_messages: {
    code: 'company_messages',
    title: 'Mensajería disponible con Empresa Pro',
    message: 'Empresa Pro habilita la mensajería directa con estudiantes.',
    action: 'Solicitar Empresa Pro',
  },
};

export function planRestriction(code: PlanRestrictionCode): PlanRestriction {
  return RESTRICTIONS[code];
}

export function restrictionFromError(error: unknown): PlanRestriction | null {
  const message = error instanceof Error
    ? error.message
    : error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : String(error ?? '');
  if (/FREE_CONNECTION_MONTHLY_LIMIT/i.test(message)) return RESTRICTIONS.student_connections;
  if (/FREE_STUDENT_MONTHLY_APPLICATION_LIMIT/i.test(message)) return RESTRICTIONS.student_applications;
  if (/FREE_COMPANY_MONTHLY_LIMIT/i.test(message)) return RESTRICTIONS.company_posts;
  return null;
}