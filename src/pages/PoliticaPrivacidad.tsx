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
      intro="En PasantIA nos tomamos en serio la privacidad de estudiantes y empresas. Esta política explica qué datos recolectamos durante la etapa de acceso anticipado y cómo los usamos."
      blocks={[
        {
          heading: 'Qué datos recolectamos',
          body: (
            <p>
              Durante el acceso anticipado recolectamos los datos que nos brindás
              voluntariamente en el formulario: nombre, email, teléfono (opcional) y
              datos de contexto (universidad y carrera, o empresa y rubro, según el caso).
            </p>
          ),
        },
        {
          heading: 'Para qué los usamos',
          body: (
            <p>
              Usamos tus datos únicamente para contactarte respecto del lanzamiento de
              PasantIA, gestionar tu lugar en la lista de acceso anticipado y mejorar el
              producto. No los usamos para fines ajenos a estos objetivos.
            </p>
          ),
        },
        {
          heading: 'Con quién los compartimos',
          body: (
            <p>
              No vendemos ni compartimos tu información personal con terceros ajenos a
              PasantIA. Podemos usar proveedores de servicios (por ejemplo, herramientas
              de email) que actúan bajo nuestras instrucciones y con las debidas garantías.
            </p>
          ),
        },
        {
          heading: 'Tus derechos',
          body: (
            <p>
              Podés solicitar acceder, rectificar o eliminar tus datos en cualquier
              momento escribiéndonos a{' '}
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
