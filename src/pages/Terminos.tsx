import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { LegalPage } from '../components/sections/LegalPage';
import { CONTACT } from '../lib/constants';
import { TERMS_UPDATED_LABEL } from '../lib/legal';

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
      updated={TERMS_UPDATED_LABEL}
      intro="Estos términos regulan el acceso y uso de PasantIA. Al crear una cuenta, aceptar estos términos o usar la plataforma, declarás que los leíste y aceptás quedar sujeto a ellos."
      blocks={[
        {
          heading: 'Naturaleza y alcance del servicio',
          body: (
            <>
              <p>
                PasantIA es exclusivamente una <strong>plataforma tecnológica de conexión y matching</strong>{' '}
                entre estudiantes, empresas y comunidades. Facilita la publicación de oportunidades, las
                postulaciones y el contacto inicial entre usuarios.
              </p>
              <p>
                PasantIA no es una agencia de empleo, empresa de servicios eventuales, institución
                educativa, empleadora, contratista, representante ni asesora legal de los usuarios. No
                intermedia ni asesora en la contratación, la confección de convenios o los acuerdos legales
                y económicos entre las partes, y no participa en las relaciones laborales, educativas,
                civiles o comerciales que puedan surgir después de una conexión.
              </p>
            </>
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
          heading: 'Acuerdos privados y obligaciones de las partes',
          body: (
            <>
              <p>
                Las partes reconocen y aceptan que cualquier entrevista, acuerdo, contratación o pasantía
                posterior al matching se celebra de forma <strong>estrictamente privada y externa a
                PasantIA</strong>. La plataforma no negocia condiciones, no cobra ni paga asignaciones,
                salarios u honorarios, no redacta contratos y no supervisa la relación posterior.
              </p>
              <p>
                Corresponde exclusivamente a estudiantes, empresas e instituciones educativas verificar y
                cumplir la normativa aplicable y gestionar, cuando corresponda, convenios marco,
                autorizaciones, acuerdos individuales, seguros, cobertura de salud, condiciones económicas
                y demás requisitos legales. PasantIA no confecciona, valida ni garantiza esos instrumentos
                y no responde por su ausencia, invalidez o incumplimiento.
              </p>
            </>
          ),
        },
        {
          heading: 'Contenido e información de los usuarios',
          body: (
            <>
              <p>
                Cada usuario es el único responsable de los datos y contenidos que publica, incluidos
                perfiles, currículums, documentos, ofertas, imágenes, anuncios y mensajes, y garantiza que
                son <strong>reales, actuales, lícitos</strong> y que cuenta con derechos para compartirlos.
              </p>
              <p>
                PasantIA puede aplicar controles, verificaciones y moderación, pero no realiza una validación
                exhaustiva ni garantiza la identidad, capacidad, solvencia, exactitud, licitud o calidad de
                cada usuario, oferta o contenido. Está prohibido publicar información falsa, engañosa,
                discriminatoria, ilegal o que infrinja derechos de terceros.
              </p>
            </>
          ),
        },
        {
          heading: 'Publicación y selección de pasantías',
          body: (
            <p>
              Quien publique una oportunidad declara que es real, legítima, no discriminatoria y que está
              autorizado para ofrecerla. La empresa es la única responsable del proceso de selección, de
              comprobar que la modalidad propuesta pueda formalizarse legalmente y de comunicar sus
              condiciones. PasantIA puede moderar o eliminar publicaciones, pero no garantiza entrevistas,
              contrataciones ni resultados.
            </p>
          ),
        },
        {
          heading: 'Empresas verificadas',
          body: (
            <p>
              El distintivo de <strong>“empresa verificada”</strong> indica que PasantIA realizó controles
              razonables para reducir el riesgo de suplantación. No constituye certificación legal,
              financiera o laboral, ni garantiza solvencia, cumplimiento normativo o calidad de las ofertas.
            </p>
          ),
        },
        {
          heading: 'Planes y funciones',
          body: (
            <>
              <p>
                PasantIA puede ofrecer distintos planes con diferentes límites y funciones. Las
                características y vigencia aplicables serán las informadas al momento de solicitar o activar
                cada plan.
              </p>
              <p>
                PasantIA puede modificar, discontinuar o actualizar planes, funciones y límites, notificando
                los cambios relevantes a través de la plataforma y respetando los derechos irrenunciables
                reconocidos por la normativa aplicable.
              </p>
            </>
          ),
        },
        {
          heading: 'Comunidades y comunicaciones',
          body: (
            <p>
              Las comunidades, chats y publicaciones deben respetar las{' '}
              <Link to="/normas-comunidad" className="font-medium text-white underline underline-offset-4">
                Normas de la comunidad
              </Link>
              . No se permite el acoso, el discurso de odio, el spam, el contenido ilegal ni la infracción
              de derechos de terceros. Los usuarios pueden reportar contenido o perfiles desde la plataforma.
            </p>
          ),
        },
        {
          heading: 'Propiedad intelectual',
          body: (
            <p>
              La marca, el software, el diseño y los contenidos propios de PasantIA están protegidos. Cada
              usuario conserva los derechos sobre el contenido que publica y otorga a PasantIA una licencia
              no exclusiva, gratuita y limitada a alojarlo, mostrarlo y procesarlo para operar y promocionar
              el servicio mientras permanezca publicado.
            </p>
          ),
        },
        {
          heading: 'Moderación, suspensión y baja',
          body: (
            <p>
              PasantIA puede moderar o eliminar contenidos y suspender o cerrar cuentas que incumplan estos
              términos, vulneren derechos, intenten cometer fraude o generen riesgos para la comunidad. El
              usuario puede solicitar la baja de su cuenta escribiendo a{' '}
              <a href={`mailto:${CONTACT.email}`} className="font-medium text-white underline underline-offset-4">
                {CONTACT.email}
              </a>
              .
            </p>
          ),
        },
        {
          heading: 'Disponibilidad y limitación de responsabilidad',
          body: (
            <>
              <p>
                PasantIA se ofrece según su disponibilidad y puede presentar interrupciones, errores o
                cambios. No garantiza que el servicio sea ininterrumpido ni que una conexión produzca una
                entrevista, contratación o pasantía.
              </p>
              <p>
                En la máxima medida permitida por la ley, PasantIA no será responsable por la información o
                conducta de terceros, acuerdos celebrados fuera de la plataforma, incumplimientos legales de
                los usuarios, daños indirectos, pérdida de oportunidades, lucro cesante ni disputas
                laborales, educativas, civiles o comerciales derivadas de una conexión. Nada de lo aquí
                previsto limita derechos o responsabilidades que legalmente no puedan excluirse.
              </p>
            </>
          ),
        },
        {
          heading: 'Privacidad y datos personales',
          body: (
            <p>
              El tratamiento de datos personales se rige por nuestra{' '}
              <Link to="/politica-de-privacidad" className="font-medium text-white underline underline-offset-4">
                Política de privacidad
              </Link>
              . Cada usuario debe respetar la confidencialidad y utilizar los datos de otros usuarios solo
              para la finalidad legítima por la cual recibió acceso.
            </p>
          ),
        },
        {
          heading: 'Ley aplicable y resolución de conflictos',
          body: (
            <p>
              Estos términos se rigen por las leyes de la <strong>República Argentina</strong>. Las partes
              procurarán resolver cualquier diferencia de buena fe. La jurisdicción se determinará según la
              normativa aplicable, sin afectar los derechos que correspondan a consumidores y usuarios.
            </p>
          ),
        },
        {
          heading: 'Cambios y contacto',
          body: (
            <p>
              PasantIA puede actualizar estos términos para reflejar cambios del servicio o legales. La
              versión vigente y su fecha estarán publicadas en esta página y los cambios relevantes serán
              comunicados por medios razonables. Para consultas, escribinos a{' '}
              <a href={`mailto:${CONTACT.email}`} className="font-medium text-white underline underline-offset-4">
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
