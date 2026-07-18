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
  // Locales / regionales
  'ICES',
  'Instituto San José',
  'UNRaf — Univ. Nacional de Rafaela',
  // Nacionales más elegidas
  'UBA — Univ. de Buenos Aires',
  'UTN — Univ. Tecnológica Nacional',
  'UNLP — Univ. Nacional de La Plata',
  'UNC — Univ. Nacional de Córdoba',
  'UNR — Univ. Nacional de Rosario',
  'UNL — Univ. Nacional del Litoral',
  'UNCuyo — Univ. Nacional de Cuyo',
  'UNT — Univ. Nacional de Tucumán',
  'UNMdP — Univ. Nacional de Mar del Plata',
  'UNS — Univ. Nacional del Sur',
  'UNICEN — Univ. Nacional del Centro',
  'UNComahue — Univ. Nacional del Comahue',
  // Área metropolitana (AMBA)
  'UNSAM — Univ. Nacional de San Martín',
  'UNQ — Univ. Nacional de Quilmes',
  'UNLa — Univ. Nacional de Lanús',
  'UNTREF — Univ. Nacional de Tres de Febrero',
  'UNGS — Univ. Nacional de General Sarmiento',
  'UNLu — Univ. Nacional de Luján',
  'UNLZ — Univ. Nacional de Lomas de Zamora',
  'UNLaM — Univ. Nacional de La Matanza',
  'UNAJ — Univ. Nacional Arturo Jauretche',
  'UNDAV — Univ. Nacional de Avellaneda',
  'UNM — Univ. Nacional de Moreno',
  'UNPAZ — Univ. Nacional de José C. Paz',
  'UNAHUR — Univ. Nacional de Hurlingham',
  'UNO — Univ. Nacional del Oeste',
  'UNA — Univ. Nacional de las Artes',
  // Regionales (resto del país)
  'UNSJ — Univ. Nacional de San Juan',
  'UNSL — Univ. Nacional de San Luis',
  'UNSa — Univ. Nacional de Salta',
  'UNJu — Univ. Nacional de Jujuy',
  'UNCa — Univ. Nacional de Catamarca',
  'UNLaR — Univ. Nacional de La Rioja',
  'UNSE — Univ. Nacional de Santiago del Estero',
  'UNNE — Univ. Nacional del Nordeste',
  'UNaM — Univ. Nacional de Misiones',
  'UNER — Univ. Nacional de Entre Ríos',
  'UNL Pam — Univ. Nacional de La Pampa',
  'UNRC — Univ. Nacional de Río Cuarto',
  'UNVM — Univ. Nacional de Villa María',
  'UNRN — Univ. Nacional de Río Negro',
  'UNPSJB — Univ. Nacional de la Patagonia San Juan Bosco',
  'UNPA — Univ. Nacional de la Patagonia Austral',
  'UNTDF — Univ. Nacional de Tierra del Fuego',
  'UNAF — Univ. Nacional de Formosa',
  // Privadas
  'UCA — Univ. Católica Argentina',
  'UADE — Univ. Argentina de la Empresa',
  'Universidad Austral',
  'UdeSA — Univ. de San Andrés',
  'ITBA — Inst. Tecnológico de Buenos Aires',
  'UTDT — Univ. Torcuato Di Tella',
  'Universidad de Palermo (UP)',
  'USAL — Univ. del Salvador',
  'UB — Univ. de Belgrano',
  'UCES — Univ. de Ciencias Empresariales y Sociales',
  'UAI — Univ. Abierta Interamericana',
  'Universidad de Morón',
  'CAECE — Univ. CAECE',
  'Universidad Maimónides',
  'UK — Univ. J. F. Kennedy',
  'Universidad Siglo 21',
  'UBP — Univ. Blas Pascal',
  'UCC — Univ. Católica de Córdoba',
  'UCSE — Univ. Católica de Santiago del Estero',
  'UCASAL — Univ. Católica de Salta',
  'Universidad de Mendoza (UM)',
  'Universidad del Aconcagua',
  'Universidad FASTA',
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
  communityTypes: [
    'Instagram',
    'Grupo de Discord',
    'Grupo de Telegram',
    'Centro de Estudiantes',
    'Universidad',
    'Otro',
  ],
  followerRanges: [
    'Menos de 1K',
    '1K - 5K',
    '5K - 10K',
    '10K - 50K',
    '50K - 100K',
    '100K+',
  ],
} as const;

export const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Estudiantes', to: '/estudiantes' },
  { label: 'Empresas', to: '/empresas' },
  { label: 'Embajadores', to: '/embajadores' },
] as const;

// Enlaces que hacen scroll a secciones del home (hash).
export const HASH_LINKS = [
  { label: 'Cómo funciona', to: '/#como-funciona' },
  { label: 'FAQs', to: '/#faqs' },
] as const;
