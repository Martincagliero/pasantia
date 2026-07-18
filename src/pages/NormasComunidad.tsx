import { useSeo } from '../hooks/useSeo';
import { LegalPage } from '../components/sections/LegalPage';
import { CONTACT } from '../lib/constants';

export default function NormasComunidad() {
  useSeo({
    title: 'Normas de la comunidad',
    description:
      'Reglas de convivencia de PasantIA: qué está permitido, qué no, y cómo reportar contenido o perfiles.',
    path: '/normas-comunidad',
  });

  return (
    <LegalPage
      title="Normas de la comunidad"
      updated="Julio 2026"
      intro="PasantIA es un espacio para que estudiantes, empresas y embajadores se conecten de forma segura y respetuosa. Estas normas aplican a todo el contenido: pasantías, anuncios, comunidades, mensajes y perfiles."
      blocks={[
        {
          heading: 'Respeto y buen trato',
          body: (
            <p>
              Tratá a todos con respeto. No se permite el <strong>acoso, el discurso de odio</strong>, las
              amenazas ni la discriminación por género, origen, religión, orientación, discapacidad o
              cualquier otra condición.
            </p>
          ),
        },
        {
          heading: 'Contenido prohibido',
          body: (
            <p>
              Está prohibido publicar contenido <strong>ilegal, violento, sexual, engañoso</strong> o que
              incite al odio o a actividades peligrosas. Tampoco se permite el spam, la publicidad no
              solicitada ni los esquemas fraudulentos.
            </p>
          ),
        },
        {
          heading: 'Pasantías reales',
          body: (
            <p>
              Las pasantías deben ser <strong>reales y legítimas</strong>. No publiques ofertas falsas,
              estafas, ventas piramidales ni trabajos que no sean pasantías. Las empresas verificadas
              generan más confianza en la comunidad.
            </p>
          ),
        },
        {
          heading: 'Identidad auténtica',
          body: (
            <p>
              Usá tu identidad real y no te hagas pasar por otra persona, empresa u organización.
              Suplantar a una empresa o usar su logo sin autorización está prohibido.
            </p>
          ),
        },
        {
          heading: 'Propiedad intelectual',
          body: (
            <p>
              Publicá solo contenido que te pertenezca o que tengas derecho a compartir. No subas
              imágenes, documentos ni textos que infrinjan <strong>derechos de autor</strong> de terceros.
            </p>
          ),
        },
        {
          heading: 'Cómo reportar',
          body: (
            <p>
              Si ves una pasantía, un anuncio o un perfil que incumple estas normas, usá el botón de{' '}
              <strong>reportar</strong> (ícono de bandera) disponible en cada publicación y perfil. Los
              reportes son <strong>confidenciales</strong> y los revisa nuestro equipo.
            </p>
          ),
        },
        {
          heading: 'Consecuencias',
          body: (
            <p>
              El incumplimiento de estas normas puede derivar en la <strong>eliminación del contenido</strong>{' '}
              y en la <strong>suspensión o baja de la cuenta</strong>, según la gravedad. En casos que
              impliquen delitos, podemos colaborar con las autoridades competentes.
            </p>
          ),
        },
        {
          heading: 'Contacto',
          body: (
            <p>
              ¿Dudas o querés reportar algo que no aparece en la plataforma? Escribinos a{' '}
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
