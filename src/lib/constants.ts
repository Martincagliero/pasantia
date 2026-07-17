// Datos de marca y contacto centralizados.
// Si cambian los datos de contacto, se editan solo acá.

export const CONTACT = {
  email: 'holapasantia@gmail.com',
  instagram: 'pasant.ia',
  instagramUrl: 'https://www.instagram.com/pasant.ia/',
  whatsappNumber: '5493493406303',
} as const;

/**
 * Construye un deep link a WhatsApp con mensaje predefinido.
 * El mensaje se codifica con encodeURIComponent.
 */
export function whatsappLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Mensajes predefinidos por contexto de acceso anticipado.
export const WHATSAPP_MESSAGES = {
  general: '¡Hola! Quiero sumarme a la lista de acceso anticipado de PasantIA.',
  student:
    '¡Hola! Quiero sumarme a la lista de acceso anticipado de PasantIA como estudiante.',
  company:
    '¡Hola! Quiero sumar a mi empresa a la lista de acceso anticipado de PasantIA.',
} as const;

/**
 * Construye un link mailto con asunto y cuerpo predefinidos (codificados).
 * El acceso anticipado se solicita por email.
 */
export function mailtoLink(subject: string, body: string): string {
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

// Asunto + cuerpo predefinidos por contexto de acceso anticipado (email).
export const EMAIL_MESSAGES = {
  general: {
    subject: 'Acceso anticipado — PasantIA',
    body: '¡Hola! Quiero sumarme a la lista de acceso anticipado de PasantIA.',
  },
  student: {
    subject: 'Acceso anticipado (estudiante) — PasantIA',
    body: '¡Hola! Quiero sumarme a la lista de acceso anticipado de PasantIA como estudiante.',
  },
  company: {
    subject: 'Acceso anticipado (empresa) — PasantIA',
    body: '¡Hola! Quiero sumar a mi empresa a la lista de acceso anticipado de PasantIA.',
  },
} as const;

export type EmailMessage = { subject: string; body: string };

/**
 * Endpoint para recibir las solicitudes de acceso anticipado (formulario).
 * Recomendado: crear un formulario GRATIS en https://formspree.io y pegar acá
 * el endpoint (ej: 'https://formspree.io/f/abcdwxyz'). Las respuestas te llegan
 * directo a tu email (holapasantia@gmail.com).
 *
 * Mientras esté vacío, el formulario usa un fallback: arma un email con todos
 * los datos y abre el cliente de correo del visitante hacia holapasantia@gmail.com.
 */
export const FORM_ENDPOINT = 'https://formspree.io/f/mdaqeyjr';

/**
 * (Opcional, recomendado para producción) Supabase: si completás estos datos,
 * las solicitudes se guardan en una tabla de tu base de datos.
 *   1. Creá un proyecto en https://supabase.com
 *   2. Creá una tabla `early_access_signups` con columnas de texto que coincidan
 *      con las claves del payload (rol, nombre, email, telefono, universidad,
 *      carrera, anio, area, disponibilidad, empresa, rubro, tamano, perfil,
 *      mensaje, origen).
 *   3. Activá RLS y una policy de INSERT para `anon`, y pegá acá URL + anon key.
 */
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
export const SUPABASE_TABLE = 'early_access_signups';

// Universidades / institutos con autocompletado (se puede escribir libremente).
export const UNIVERSIDADES = [
  'ICES',
  'Instituto San José',
  'UCSE — Univ. Católica de Santiago del Estero',
  'UCES — Univ. de Ciencias Empresariales y Sociales',
  'UNRaf — Univ. Nacional de Rafaela',
  'UTN — Univ. Tecnológica Nacional',
  'UBA — Univ. de Buenos Aires',
  'UCA — Univ. Católica Argentina',
  'UNL — Univ. Nacional del Litoral',
  'UNR — Univ. Nacional de Rosario',
  'UNC — Univ. Nacional de Córdoba',
  'UNLP — Univ. Nacional de La Plata',
  'Universidad Siglo 21',
  'UADE',
  'Universidad Austral',
  'Universidad de Palermo',
  'ITBA',
  'Universidad Torcuato Di Tella',
  'Otra',
] as const;

// Opciones para los pasos del formulario de acceso anticipado.
export const FORM_OPTIONS = {
  anioCursada: [
    '1er año',
    '2do año',
    '3er año',
    '4to año',
    '5to año o más',
    'Graduado/a reciente',
  ],
  areasInteres: [
    'Tecnología',
    'Marketing',
    'Diseño',
    'Administración',
    'Finanzas',
    'Ingeniería',
    'Recursos Humanos',
    'Datos',
    'Comercial',
    'Legales',
  ],
  disponibilidad: ['Part-time', 'Full-time', 'Flexible', 'A definir'],
  rubros: [
    'Tecnología',
    'Marketing',
    'Finanzas',
    'Industria',
    'Retail',
    'Salud',
    'Educación',
    'Servicios',
    'Otro',
  ],
  tamanoEmpresa: ['1-10', '11-50', '51-200', '200+'],
} as const;

export const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Estudiantes', to: '/estudiantes' },
  { label: 'Empresas', to: '/empresas' },
] as const;

// Enlaces que hacen scroll a secciones del home (hash).
export const HASH_LINKS = [
  { label: 'Cómo funciona', to: '/#como-funciona' },
  { label: 'FAQs', to: '/#faqs' },
] as const;
