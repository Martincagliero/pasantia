// Sugerencias inteligentes para el perfil del estudiante.
// Según la carrera (match por palabras clave, tolera texto libre) se proponen
// áreas de interés y habilidades relacionadas para que el armado sea rápido.

/** Carreras comunes para el autocompletado del campo Carrera. */
export const CAREERS = [
  'Ingeniería en Sistemas',
  'Ciencias de la Computación',
  'Analista de Sistemas',
  'Licenciatura en Informática',
  'Diseño UX/UI',
  'Diseño Gráfico',
  'Diseño Industrial',
  'Marketing',
  'Publicidad',
  'Comunicación Social',
  'Relaciones Públicas',
  'Administración de Empresas',
  'Contador Público',
  'Economía',
  'Comercio Internacional',
  'Recursos Humanos',
  'Psicología',
  'Abogacía',
  'Ingeniería Industrial',
  'Ingeniería Electrónica',
  'Traductorado',
  'Turismo',
] as const;

/** Opciones sugeridas de disponibilidad. */
export const AVAILABILITY_OPTIONS = [
  'Medio día',
  'Jornada completa',
  '20 hs semanales',
  'Turno mañana',
  'Turno tarde',
  'Horario flexible',
  'Fines de semana',
] as const;

interface SuggestionRule {
  match: string[]; // palabras clave que se buscan dentro de la carrera (en minúsculas)
  areas: string[];
  skills: string[];
}

const RULES: SuggestionRule[] = [
  {
    match: ['sistemas', 'computación', 'computacion', 'informát', 'informat', 'software', 'datos', 'programación', 'programacion'],
    areas: ['Desarrollo de software', 'Data / Analytics', 'QA / Testing', 'Soporte IT', 'Ciberseguridad'],
    skills: ['JavaScript', 'Python', 'SQL', 'Git', 'React', 'HTML/CSS'],
  },
  {
    match: ['ux', 'ui', 'diseño gráf', 'diseño graf', 'multimedia'],
    areas: ['Diseño UX/UI', 'Diseño gráfico', 'Producto', 'Branding'],
    skills: ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'Prototipado', 'Design System'],
  },
  {
    match: ['diseño industrial', 'industrial design'],
    areas: ['Diseño de producto', 'Diseño industrial', 'Modelado 3D'],
    skills: ['SolidWorks', 'AutoCAD', 'Rhino', 'Prototipado', 'Renderizado'],
  },
  {
    match: ['marketing', 'publicidad', 'comunicación', 'comunicacion', 'relaciones púb', 'relaciones pub'],
    areas: ['Marketing digital', 'Redes sociales', 'Contenidos', 'Publicidad', 'Comunicación'],
    skills: ['Community Management', 'SEO', 'Google Analytics', 'Copywriting', 'Meta Ads', 'Canva'],
  },
  {
    match: ['administr', 'contad', 'economí', 'economi', 'finanz', 'comercio'],
    areas: ['Administración', 'Finanzas', 'Contabilidad', 'Ventas', 'Comercio exterior'],
    skills: ['Excel', 'Power BI', 'SAP', 'Tango', 'Análisis financiero', 'Inglés'],
  },
  {
    match: ['recursos humanos', 'rrhh', 'psicolog'],
    areas: ['Recursos Humanos', 'Selección', 'Capacitación', 'Clima laboral'],
    skills: ['Reclutamiento', 'Entrevistas', 'Excel', 'Comunicación', 'LinkedIn Recruiter'],
  },
  {
    match: ['abogac', 'derecho', 'legal'],
    areas: ['Legales', 'Compliance', 'Contratos'],
    skills: ['Redacción jurídica', 'Investigación', 'Análisis normativo', 'Inglés'],
  },
  {
    match: ['industrial', 'logíst', 'logist'],
    areas: ['Operaciones', 'Logística', 'Mejora continua', 'Calidad'],
    skills: ['Excel', 'AutoCAD', 'Lean', 'Six Sigma', 'Análisis de datos'],
  },
  {
    match: ['electrón', 'electron', 'mecatrón', 'mecatron', 'eléctr', 'electr'],
    areas: ['Electrónica', 'IoT', 'Automatización', 'Hardware'],
    skills: ['Arduino', 'C/C++', 'MATLAB', 'KiCad', 'Sistemas embebidos'],
  },
  {
    match: ['traduct', 'idiomas', 'letras'],
    areas: ['Traducción', 'Localización', 'Corrección', 'Contenidos'],
    skills: ['Inglés', 'Portugués', 'CAT Tools', 'Redacción', 'Corrección'],
  },
  {
    match: ['turismo', 'hotel'],
    areas: ['Turismo', 'Hospitalidad', 'Eventos'],
    skills: ['Atención al cliente', 'Inglés', 'Organización', 'Ventas'],
  },
];

/** Sugerencias por defecto cuando la carrera no matchea ninguna regla. */
const DEFAULT: Pick<SuggestionRule, 'areas' | 'skills'> = {
  areas: ['Administración', 'Marketing', 'Atención al cliente', 'Operaciones', 'Ventas'],
  skills: ['Excel', 'Inglés', 'Comunicación', 'Trabajo en equipo', 'Organización'],
};

/** Devuelve áreas y habilidades sugeridas según la carrera escrita. */
export function suggestFor(career: string): { areas: string[]; skills: string[] } {
  const c = career.trim().toLowerCase();
  if (!c) return DEFAULT;
  const rule = RULES.find((r) => r.match.some((k) => c.includes(k)));
  return rule ? { areas: rule.areas, skills: rule.skills } : DEFAULT;
}
