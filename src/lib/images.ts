// Imágenes de Unsplash centralizadas.
// TODO: si más adelante se quieren imágenes propias, reemplazar estas URLs
// por archivos en /src/assets/images/ y actualizar acá.
const p = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  // Hero / generales
  heroStudents: p('photo-1522071820081-009f0129c71c'),
  heroOffice: p('photo-1600880292203-757bb62b4baf'),
  collaboration: p('photo-1552664730-d307ca884978'),

  // Estudiantes
  studentLaptop: p('photo-1523240795612-9a054b0db644'),
  studentSmiling: p('photo-1531123897727-8f129e1688ce'),
  studentGroup: p('photo-1543269865-cbf427effbad'),
  studying: p('photo-1513258496099-48168024aec0'),

  // Empresas
  officeTeam: p('photo-1497366754035-f200968a6e72'),
  meeting: p('photo-1600880292089-90a7e086ee0c'),
  interview: p('photo-1521737711867-e3b97375f902'),
  modernOffice: p('photo-1497366811353-6870744d04b2'),

  // Pasos "cómo funciona"
  profile: p('photo-1499750310107-5fef28a66643'),
  matching: p('photo-1600880292089-90a7e086ee0c'),
  apply: p('photo-1552581234-26160f608093'),
  start: p('photo-1521791136064-7986c2920216'),

  // 2da sección: preview del producto.
  // TODO: reemplazar por la imagen propia que suba el usuario (src/assets/images/).
  appPreview: p('photo-1551288049-bebda4e38f71', 1600),
} as const;

// Avatares pequeños para la fila de confianza del hero (rostros).
const avatar = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=96&h=96&q=80&crop=faces`;

export const AVATARS = [
  avatar('photo-1494790108377-be9c29b29330'),
  avatar('photo-1500648767791-00dcc994a43e'),
  avatar('photo-1438761681033-6461ffad8d80'),
  avatar('photo-1507003211169-0a1dd7228f2d'),
] as const;
