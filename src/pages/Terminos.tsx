import { useSeo } from '../hooks/useSeo';
import { LegalPage } from '../components/sections/LegalPage';
import { CONTACT } from '../lib/constants';

export default function Terminos() {
  useSeo({
    title: 'Términos y condiciones',
    description: 'Términos y condiciones de uso del sitio y del acceso anticipado de PasantIA.',
    path: '/terminos',
  });

  return (
    <LegalPage
      title="Términos y condiciones"
      updated="Julio 2026"
      intro="Estos términos regulan el uso del sitio de PasantIA y la participación en la lista de acceso anticipado mientras la plataforma está en desarrollo."
      blocks={[
        {
          heading: 'Sobre PasantIA',
          body: (
            <p>
              PasantIA es una plataforma en desarrollo que conectará estudiantes con
              empresas para gestionar pasantías. Actualmente el sitio funciona como
              presentación y registro de interés (acceso anticipado); el sistema completo
              aún no está disponible.
            </p>
          ),
        },
        {
          heading: 'Acceso anticipado',
          body: (
            <p>
              Sumarte a la lista de acceso anticipado no garantiza disponibilidad
              inmediata del servicio ni condiciones específicas. Te contactaremos con
              novedades a medida que avancemos hacia el lanzamiento.
            </p>
          ),
        },
        {
          heading: 'Uso del sitio',
          body: (
            <p>
              Te comprometés a brindar información veraz y a usar el sitio de forma lícita.
              Nos reservamos el derecho de modificar o discontinuar funcionalidades del
              sitio en cualquier momento.
            </p>
          ),
        },
        {
          heading: 'Propiedad intelectual',
          body: (
            <p>
              La marca, el logo y los contenidos de PasantIA pertenecen a PasantIA. No está
              permitido reproducirlos sin autorización.
            </p>
          ),
        },
        {
          heading: 'Contacto',
          body: (
            <p>
              Por consultas sobre estos términos, escribinos a{' '}
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
