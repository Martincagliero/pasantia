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
      updated="24 de agosto de 2026"
      intro="Esta política explica cómo PasantIA trata los datos personales de estudiantes, empresas, embajadores, promotores y visitantes en el sitio, la aplicación web y sus comunicaciones. El tratamiento se realiza conforme a la Ley argentina 25.326, su Decreto Reglamentario 1558/2001 y demás normas aplicables."
      blocks={[
        {
          heading: 'Responsable y contacto',
          body: (
            <p>
              PasantIA es responsable del tratamiento de los datos personales alcanzados por esta
              política. Para consultas, ejercicio de derechos o reclamos de privacidad, escribinos a{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium text-white underline underline-offset-4"
              >
                {CONTACT.email}
              </a>
              . Indicá en el asunto “Privacidad” y brindá la información necesaria para identificar tu
              cuenta y responder la solicitud.
            </p>
          ),
        },
        {
          heading: 'Qué datos tratamos',
          body: (
            <>
              <p>Según cómo uses PasantIA, podemos tratar las siguientes categorías:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Registro e identidad:</strong> nombre, email, rol, fecha de nacimiento cuando
                  corresponda, aceptación de términos, estado de cuenta y datos recibidos de Google si
                  elegís ese método de acceso. La contraseña es tratada por el proveedor de autenticación.
                </li>
                <li>
                  <strong>Perfil y contacto:</strong> foto o logo, teléfono, ubicación, universidad,
                  carrera, año, área, disponibilidad, habilidades, biografía, redes sociales, enlaces y,
                  para organizaciones, nombre, rubro, tamaño, sitio web y descripción.
                </li>
                <li>
                  <strong>Información académica y profesional:</strong> CV, analítico, promedio,
                  portfolio, experiencia, preferencias, postulaciones, mensajes de presentación y estados
                  de procesos de selección.
                </li>
                <li>
                  <strong>Actividad y contenido:</strong> pasantías, publicaciones, imágenes, enlaces,
                  comentarios, reacciones, menciones, comunidades, membresías, conexiones, seguidores,
                  mensajes privados, reportes y actuaciones de moderación.
                </li>
                <li>
                  <strong>Planes y promociones:</strong> plan, vigencia, solicitudes y decisiones de
                  suscripción, códigos de referido o promotor y métricas asociadas. No publiques datos de
                  tarjetas en perfiles, mensajes ni formularios generales.
                </li>
                <li>
                  <strong>Datos técnicos:</strong> identificadores de cuenta y sesión, dirección IP y
                  registros generados por proveedores, navegador, dispositivo, sistema operativo, fechas,
                  errores, eventos de seguridad y suscripciones técnicas de notificaciones push.
                </li>
              </ul>
              <p>
                No te pedimos datos sensibles en los términos del artículo 2 de la Ley 25.326. No los
                incluyas en perfiles, CV, publicaciones o mensajes salvo que sean estrictamente necesarios
                y tengas una base legítima para hacerlo.
              </p>
            </>
          ),
        },
        {
          heading: 'Cómo obtenemos los datos',
          body: (
            <p>
              Obtenemos datos directamente de vos cuando te registrás, completás el perfil, postulás,
              publicás, enviás mensajes, te unís a una comunidad, solicitás un plan o contactás soporte.
              También recibimos datos de otros usuarios cuando interactúan con vos o te mencionan, de
              Google cuando usás su inicio de sesión y de proveedores técnicos que operan el servicio. Los
              datos de referidos provienen del enlace utilizado para ingresar.
            </p>
          ),
        },
        {
          heading: 'Para qué usamos los datos',
          body: (
            <>
              <p>Tratamos los datos para:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>crear, autenticar, mantener y proteger cuentas;</li>
                <li>mostrar perfiles y facilitar búsquedas, matching, contactos y postulaciones;</li>
                <li>permitir publicaciones, comunidades, conexiones, mensajes y notificaciones;</li>
                <li>administrar planes, beneficios, rankings, promotores y referidos;</li>
                <li>verificar cuentas, prevenir fraude, investigar reportes y moderar contenido;</li>
                <li>atender soporte, solicitudes de derechos e incidentes;</li>
                <li>mantener, diagnosticar, asegurar y mejorar la plataforma; y</li>
                <li>cumplir obligaciones legales y requerimientos válidos de autoridades.</li>
              </ul>
              <p>No vendemos datos personales ni los usamos para publicidad comportamental de terceros.</p>
            </>
          ),
        },
        {
          heading: 'Bases que justifican el tratamiento',
          body: (
            <p>
              Según el caso, tratamos datos con tu consentimiento; para prestar las funciones que
              solicitás y gestionar la relación con vos; para cumplir obligaciones legales; y para
              intereses legítimos compatibles con tus derechos, como proteger la plataforma, prevenir
              abusos, moderar y mejorar el servicio. Cuando el tratamiento dependa del consentimiento,
              podés retirarlo hacia el futuro sin afectar el tratamiento previo ni aquel sustentado en
              otra base legal.
            </p>
          ),
        },
        {
          heading: 'Visibilidad dentro de PasantIA',
          body: (
            <>
              <p>La visibilidad depende del tipo de dato y de la función utilizada:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  los datos de perfil configurados como visibles pueden ser consultados por otros usuarios
                  y, en páginas públicas, por visitantes;
                </li>
                <li>
                  las empresas reciben los datos y documentos necesarios de quienes se postulan a sus
                  oportunidades y gestionan el estado del proceso;
                </li>
                <li>
                  las publicaciones, comentarios, reacciones, rankings, conexiones y actividad en
                  comunidades se muestran a la audiencia indicada por cada función;
                </li>
                <li>los mensajes privados se comparten con sus participantes; y</li>
                <li>los reportes se ponen a disposición del equipo autorizado para moderación y seguridad.</li>
              </ul>
              <p>
                La interfaz reserva CV, analítico y promedio para usos profesionales autorizados, como la
                evaluación por empresas. Sin embargo, los archivos se alojan mediante enlaces técnicos:
                no compartas esos enlaces fuera de la finalidad prevista ni subas información innecesaria.
                Antes de publicar o enviar contenido, revisá qué datos incluye y quién podrá verlo.
              </p>
            </>
          ),
        },
        {
          heading: 'Proveedores y terceros',
          body: (
            <>
              <p>
                Comunicamos los datos estrictamente necesarios a proveedores que ayudan a operar el
                servicio, incluidos infraestructura y alojamiento, base de datos, autenticación,
                almacenamiento, despliegue web, email y notificaciones push. Estas funciones pueden
                involucrar servicios de <strong>Supabase, Vercel, Google</strong>, proveedores de correo y
                los servicios push del navegador o sistema operativo.
              </p>
              <p>
                Esos terceros tratan datos conforme a sus propios términos o por cuenta de PasantIA, según
                corresponda. También podremos comunicar información si una ley, orden judicial o autoridad
                competente lo exige; para investigar fraude o proteger derechos y seguridad; o en una
                reorganización del servicio, informando las medidas aplicables.
              </p>
            </>
          ),
        },
        {
          heading: 'Transferencias internacionales',
          body: (
            <p>
              Algunos proveedores pueden almacenar o tratar información fuera de Argentina. En esos casos,
              procuramos aplicar las salvaguardas exigibles según la normativa argentina, considerando el
              país de destino, las condiciones contractuales y las medidas de seguridad disponibles. Al
              usar servicios de terceros, también pueden aplicarse sus políticas de privacidad.
            </p>
          ),
        },
        {
          heading: 'Almacenamiento local y tecnologías similares',
          body: (
            <p>
              PasantIA y sus proveedores usan almacenamiento local, almacenamiento de sesión y tecnologías
              equivalentes necesarias para mantener la sesión, recordar el email si lo elegís, conservar
              preferencias, completar el onboarding, atribuir referidos, registrar notificaciones vistas
              y proteger la cuenta. No guardamos tu contraseña en el almacenamiento local del navegador.
              Podés borrar estos datos desde la configuración del navegador, aunque algunas funciones
              pueden dejar de operar o pedirte que vuelvas a iniciar sesión.
            </p>
          ),
        },
        {
          heading: 'Notificaciones y comunicaciones',
          body: (
            <p>
              Podemos enviarte emails operativos sobre tu cuenta, recuperación de acceso, postulaciones,
              planes, seguridad o cambios relevantes. Las notificaciones push se activan únicamente cuando
              lo solicitás y aceptás el permiso del dispositivo. Podés desactivarlas desde PasantIA o desde
              la configuración del navegador o sistema operativo. Aunque desactives comunicaciones
              opcionales, podremos enviar avisos indispensables para la cuenta o exigidos legalmente.
            </p>
          ),
        },
        {
          heading: 'Matching, búsquedas y decisiones',
          body: (
            <p>
              La plataforma puede ordenar, filtrar o sugerir perfiles, oportunidades y contenido a partir
              de datos como rol, área, estudios, actividad, plan o relaciones dentro de la red. Estas
              funciones facilitan el descubrimiento y el matching. PasantIA no adopta por sí sola decisiones
              de contratación: cada empresa o usuario decide de manera independiente si inicia un contacto,
              entrevista o relación posterior.
            </p>
          ),
        },
        {
          heading: 'Conservación y eliminación',
          body: (
            <p>
              Conservamos los datos mientras la cuenta esté activa y durante el tiempo necesario para las
              finalidades descriptas. Al cerrar una cuenta o recibir una solicitud válida, eliminaremos o
              anonimizaremos los datos que corresponda, sujeto a plazos técnicos razonables. Podemos
              conservar temporalmente copias de respaldo, constancias de aceptación, registros de
              seguridad, reportes, transacciones o información necesaria para cumplir obligaciones,
              resolver disputas, prevenir fraude o ejercer defensas legales. El contenido compartido con
              otros usuarios puede permanecer en sus cuentas o registros cuando exista una base legítima.
            </p>
          ),
        },
        {
          heading: 'Seguridad e incidentes',
          body: (
            <p>
              Aplicamos medidas técnicas y organizativas razonables, como autenticación, cifrado en
              tránsito, controles de acceso por rol, políticas de acceso a base de datos y restricciones
              administrativas. Ningún sistema es completamente seguro. Protegé tu contraseña, cerrá sesión
              en dispositivos compartidos y avisános de inmediato ante accesos sospechosos. Si ocurre un
              incidente que pueda afectar significativamente tus datos, evaluaremos su alcance y
              realizaremos las comunicaciones exigidas por la normativa aplicable.
            </p>
          ),
        },
        {
          heading: 'Tus derechos',
          body: (
            <>
              <p>
                Podés solicitar acceso a tus datos, su rectificación, actualización, supresión o
                confidencialidad, y oponerte o retirar el consentimiento cuando corresponda. También podés
                editar gran parte de la información desde tu perfil y solicitar la baja de la cuenta a{' '}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="font-medium text-white underline underline-offset-4"
                >
                  {CONTACT.email}
                </a>
                . Podremos pedirte información razonable para verificar tu identidad y evitar accesos no
                autorizados.
              </p>
              <p>
                El derecho de acceso puede ejercerse gratuitamente con intervalos no inferiores a seis
                meses, salvo que acredites un interés legítimo. Responderemos las solicitudes de acceso
                dentro de los diez días corridos y las de rectificación, actualización o supresión dentro
                de los cinco días hábiles, conforme a la Ley 25.326. La supresión puede no corresponder
                cuando exista un deber legal o una razón legítima de conservación.
              </p>
            </>
          ),
        },
        {
          heading: 'Datos de terceros y uso responsable',
          body: (
            <p>
              Si cargás datos de otra persona, la mencionás, la invitás o compartís documentos que la
              identifiquen, declarás que contás con autorización o con otra base legal suficiente. Quienes
              acceden a datos de candidatos, contactos o miembros deben usarlos solo para la finalidad
              profesional o comunitaria que justificó el acceso, mantener su confidencialidad y no
              venderlos, reutilizarlos para spam ni crear bases paralelas sin una base legal válida.
            </p>
          ),
        },
        {
          heading: 'Personas menores de edad',
          body: (
            <p>
              PasantIA está dirigida a personas de <strong>18 años o más</strong>. No buscamos recolectar
              conscientemente datos de menores de edad. Si creés que una persona menor creó una cuenta o
              proporcionó datos sin autorización válida, contactanos para que podamos revisarlos y adoptar
              las medidas correspondientes.
            </p>
          ),
        },
        {
          heading: 'Sitios y servicios externos',
          body: (
            <p>
              Perfiles, publicaciones y mensajes pueden contener enlaces a redes sociales, portfolios,
              sitios de empresas u otros servicios ajenos a PasantIA. No controlamos sus prácticas de
              privacidad. Revisá sus políticas antes de enviarles datos. El inicio de sesión con Google se
              rige además por la política y la configuración de privacidad de tu cuenta de Google.
            </p>
          ),
        },
        {
          heading: 'Autoridad de control y reclamos',
          body: (
            <>
              <p>
                La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la
                Ley 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes
                resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de
                protección de datos personales.
              </p>
              <p>
                Podés consultar información y canales oficiales en{' '}
                <a
                  href="https://www.argentina.gob.ar/aaip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white underline underline-offset-4"
                >
                  argentina.gob.ar/aaip
                </a>
                . Contactarnos primero no limita tu derecho a acudir ante la autoridad competente.
              </p>
            </>
          ),
        },
        {
          heading: 'Cambios a esta política',
          body: (
            <p>
              Podemos actualizar esta política para reflejar cambios legales, técnicos o del servicio. La
              versión vigente estará publicada aquí con su fecha de actualización. Cuando un cambio sea
              relevante, lo comunicaremos por medios razonables y, si la ley lo exige, solicitaremos
              nuevamente tu consentimiento. Para consultas, escribinos a{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium text-white underline underline-offset-4"
              >
                {CONTACT.email}
              </a>
              . Esta política se complementa con los Términos y condiciones y las Normas de la comunidad.
            </p>
          ),
        },
      ]}
    />
  );
}
