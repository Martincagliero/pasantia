import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { LegalPage } from '../components/sections/LegalPage';
import { CONTACT } from '../lib/constants';

export default function Terminos() {
  useSeo({
    title: 'Términos y condiciones',
    description:
      'Términos y condiciones de uso de PasantIA: responsabilidades, publicación de pasantías, comunidad, edad mínima y más.',
    path: '/terminos',
  });

  return (
    <LegalPage
      title="Términos y condiciones"
      updated="Julio 2026"
      intro="Estos términos regulan el uso de PasantIA, la plataforma que conecta estudiantes con empresas y comunidades para oportunidades de pasantías. Al crear una cuenta o usar el sitio, aceptás estas condiciones."
      blocks={[
        {
          heading: 'Sobre PasantIA',
          body: (
            <p>
              PasantIA es una plataforma que <strong>conecta estudiantes con oportunidades</strong> de
              pasantía publicadas por empresas y embajadores. PasantIA facilita el contacto y la difusión,
              pero <strong>no es empleadora</strong> ni parte de la relación entre las empresas y los
              estudiantes.
            </p>
          ),
        },
        {
          heading: 'Registro y edad mínima',
          body: (
            <p>
              Para usar la plataforma debés tener al menos <strong>18 años</strong> (o la mayoría de edad
              en tu jurisdicción) y brindar información veraz y actualizada. Sos responsable de mantener la
              confidencialidad de tu contraseña y de toda la actividad de tu cuenta.
            </p>
          ),
        },
        {
          heading: 'Responsabilidad sobre el contenido',
          body: (
            <p>
              Cada usuario es el <strong>único responsable</strong> del contenido que publica (pasantías,
              anuncios, mensajes, imágenes, CVs y documentos). PasantIA actúa como intermediario y no
              garantiza la veracidad, legalidad ni calidad de las publicaciones de terceros. No publiques
              contenido falso, engañoso, ilegal, discriminatorio ni que no te pertenezca.
            </p>
          ),
        },
        {
          heading: 'Publicación de pasantías',
          body: (
            <p>
              Las empresas y embajadores que publican pasantías declaran que las ofertas son{' '}
              <strong>reales, legítimas y no discriminatorias</strong>, y que están autorizados a
              publicarlas. Está prohibido publicar ofertas falsas, estafas, trabajos que no sean pasantías
              o cualquier contenido engañoso. PasantIA puede verificar, moderar, editar o dar de baja
              cualquier publicación.
            </p>
          ),
        },
        {
          heading: 'Comunidades y normas de convivencia',
          body: (
            <p>
              Las comunidades, chats y publicaciones deben respetar las{' '}
              <Link
                to="/normas-comunidad"
                className="font-medium text-white underline underline-offset-4"
              >
                Normas de la comunidad
              </Link>
              . No se permite el acoso, el discurso de odio, el spam, el contenido ilegal ni la
              infracción de derechos de terceros. Podés denunciar cualquier publicación o perfil con el
              botón de <strong>reportar</strong>.
            </p>
          ),
        },
        {
          heading: 'Empresas verificadas',
          body: (
            <p>
              PasantIA ofrece un distintivo de <strong>“empresa verificada”</strong> para reducir el
              riesgo de suplantación. El uso del nombre, logo o identidad de una empresa sin autorización
              está prohibido y puede derivar en la suspensión de la cuenta y en acciones legales por parte
              del titular.
            </p>
          ),
        },
        {
          heading: 'Propiedad intelectual y derechos de autor',
          body: (
            <p>
              La marca, el logo y los contenidos propios de PasantIA le pertenecen y no pueden
              reproducirse sin autorización. Respecto del contenido que subís, declarás que{' '}
              <strong>tenés los derechos necesarios</strong> y que no infringís derechos de autor ni de
              terceros. PasantIA retirará el contenido que reciba un reclamo válido de propiedad
              intelectual.
            </p>
          ),
        },
        {
          heading: 'Sin garantía de empleo',
          body: (
            <p>
              PasantIA <strong>conecta estudiantes con oportunidades</strong>, pero{' '}
              <strong>no garantiza</strong> la obtención de una pasantía, entrevista ni resultado alguno.
              El proceso de selección y la decisión final dependen exclusivamente de cada empresa.
            </p>
          ),
        },
        {
          heading: 'Moderación, suspensión y baja de cuentas',
          body: (
            <p>
              Podemos moderar contenidos y <strong>suspender o eliminar cuentas</strong> que incumplan
              estos términos, publiquen contenido indebido o generen riesgos para la comunidad. Vos también
              podés eliminar tu cuenta en cualquier momento escribiéndonos a{' '}
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
          heading: 'Responsabilidad de la plataforma',
          body: (
            <p>
              PasantIA se ofrece “tal cual está”. En la máxima medida permitida por la ley, no somos
              responsables por el contenido de terceros, por los acuerdos entre usuarios y empresas, ni por
              daños indirectos derivados del uso del servicio. Nos reservamos el derecho de modificar o
              discontinuar funcionalidades en cualquier momento.
            </p>
          ),
        },
        {
          heading: 'Ley aplicable y resolución de conflictos',
          body: (
            <p>
              Estos términos se rigen por las leyes de la <strong>República Argentina</strong>. Ante
              cualquier conflicto, las partes procurarán una solución de buena fe; de no lograrse, se
              someterán a los tribunales ordinarios competentes de Argentina.
            </p>
          ),
        },
        {
          heading: 'Cambios en los términos',
          body: (
            <p>
              Podemos actualizar estos términos para reflejar mejoras o cambios legales. Publicaremos la
              versión vigente en esta página con su fecha de actualización. El uso continuado del servicio
              implica la aceptación de los cambios.
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
