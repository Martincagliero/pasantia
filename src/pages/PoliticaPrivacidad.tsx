import { useSeo } from '../hooks/useSeo';
import { LegalPage } from '../components/sections/LegalPage';
import { CONTACT } from '../lib/constants';

export default function PoliticaPrivacidad() {
  useSeo({
    title: 'Política de privacidad',
    description: 'Cómo PasantIA recolecta, usa y protege tus datos personales.',
    path: '/politica-de-privacidad',
  });

  return (
    <LegalPage
      title="Política de privacidad"
      updated="Julio 2026"
      intro="En PasantIA nos tomamos en serio la privacidad de estudiantes, empresas y embajadores. Esta política explica qué datos personales recolectamos, para qué los usamos y cómo los protegemos, de acuerdo con la Ley 25.326 de Protección de los Datos Personales de Argentina."
      blocks={[
        {
          heading: 'Qué datos recolectamos',
          body: (
            <p>
              Recolectamos los datos que nos brindás voluntariamente al registrarte y usar la
              plataforma: <strong>nombre, email, teléfono</strong> (opcional), universidad, carrera y
              año; en el caso de empresas, datos de la organización; y el contenido que cargás, como{' '}
              <strong>CV, foto de perfil, habilidades, publicaciones y mensajes</strong>. También podemos
              registrar datos técnicos básicos de uso para operar y mejorar el servicio.
            </p>
          ),
        },
        {
          heading: 'Para qué los usamos',
          body: (
            <p>
              Usamos tus datos para <strong>conectar estudiantes con oportunidades</strong> de pasantía:
              mostrar tu perfil a empresas y comunidades según tu configuración, gestionar postulaciones y
              mensajes, verificar cuentas, moderar contenido y comunicarte novedades del servicio. No
              usamos tus datos para fines ajenos a estos objetivos.
            </p>
          ),
        },
        {
          heading: 'Con quién los compartimos',
          body: (
            <p>
              No vendemos tu información personal. Cuando publicás tu perfil o te postulás, los datos que
              elegís mostrar quedan <strong>visibles para las empresas y comunidades</strong>{' '}
              correspondientes. Usamos proveedores de servicios (por ejemplo, alojamiento y base de datos
              en Supabase, o herramientas de email) que actúan bajo nuestras instrucciones y con las
              debidas garantías de seguridad.
            </p>
          ),
        },
        {
          heading: 'Control de visibilidad',
          body: (
            <p>
              Vos controlás qué información es pública. Algunos datos sensibles, como el{' '}
              <strong>CV y el analítico, solo se muestran a empresas</strong>, no a otros estudiantes.
              Podés editar u ocultar tu perfil desde tu cuenta en cualquier momento.
            </p>
          ),
        },
        {
          heading: 'Seguridad',
          body: (
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: acceso
              autenticado, control de permisos por rol (row level security) y cifrado en tránsito. Ningún
              sistema es 100% infalible, pero trabajamos para minimizar riesgos y responder ante
              incidentes.
            </p>
          ),
        },
        {
          heading: 'Conservación de los datos',
          body: (
            <p>
              Conservamos tus datos mientras tu cuenta esté activa o mientras sean necesarios para
              prestar el servicio. Si eliminás tu cuenta, borramos o anonimizamos tu información personal,
              salvo aquello que debamos conservar por obligaciones legales.
            </p>
          ),
        },
        {
          heading: 'Tus derechos (Ley 25.326)',
          body: (
            <p>
              Podés solicitar <strong>acceder, rectificar, actualizar o eliminar</strong> tus datos, y{' '}
              <strong>eliminar tu cuenta</strong>, en cualquier momento escribiéndonos a{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium text-white underline underline-offset-4"
              >
                {CONTACT.email}
              </a>
              . La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende
              denuncias y reclamos respecto del cumplimiento de la normativa de datos personales.
            </p>
          ),
        },
        {
          heading: 'Contacto',
          body: (
            <p>
              Ante cualquier duda sobre esta política, escribinos a{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium text-white underline underline-offset-4"
              >
                {CONTACT.email}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
