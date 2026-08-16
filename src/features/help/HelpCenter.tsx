import { Bell, ChevronDown, Mail, Plus, Share2, ShieldCheck, Smartphone } from 'lucide-react';
import { CONTACT } from '../../lib/constants';
import { NotificationsButton } from '../notifications/NotificationsButton';
import { PageHeader } from '../ui/primitives';

const FAQS = [
  {
    question: '¿Cómo funcionan las conexiones entre estudiantes?',
    answer:
      'Cuando tocás Conectar enviás una solicitud. La otra persona debe aceptarla; recién entonces ambos aparecen en la red del otro. Las solicitudes recibidas están en Explorar perfiles > Red.',
  },
  {
    question: '¿Cómo funcionan los mensajes?',
    answer:
      'Podés iniciar una conversación desde cualquier perfil. Si todavía no hablaste con nadie, Mensajes te sugiere perfiles para contactar. Las respuestas aparecen en el mismo panel.',
  },
  {
    question: '¿Para qué sirve Mi red?',
    answer:
      'Reúne tus conexiones aceptadas, las empresas y comunidades que seguís, sus publicaciones recientes y las solicitudes pendientes.',
  },
  {
    question: '¿Cómo me postulo a una pasantía?',
    answer:
      'Entrá en Buscar pasantías, abrí el detalle y tocá Postularme. Después podés seguir el estado desde Mis postulaciones.',
  },
  {
    question: '¿Qué son las comunidades y los promotores?',
    answer:
      'Las comunidades difunden oportunidades. Los promotores invitan estudiantes, empresas y comunidades con su enlace personal y participan de un ranking.',
  },
  {
    question: '¿Cómo comparto un logro del ranking?',
    answer:
      'En tu fila del ranking tocá Compartir logro. En celular elegís la red instalada; en computadora se descarga la imagen para publicarla manualmente.',
  },
  {
    question: '¿Cómo reporto contenido o cuido mi privacidad?',
    answer:
      'Usá Reportar dentro del perfil o publicación correspondiente. Tu CV, analítico y promedio solo son visibles para empresas; desde tu perfil controlás el resto de la información pública.',
  },
] as const;

export default function HelpCenter() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Ayuda y soporte"
        description="Respuestas rápidas para usar PasantIA y configurar tu cuenta."
      />

      <section className="mb-7 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-white">Activá las notificaciones</h2>
            <p className="mt-1 text-sm text-white/55">
              Recibí avisos de mensajes y solicitudes de conexión aunque no tengas la app abierta.
            </p>
          </div>
        </div>
        <NotificationsButton variant="card" />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">
          Activación en celular
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <NotificationSetupCard platform="android" />
          <NotificationSetupCard platform="ios" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">
          Preguntas frecuentes
        </h2>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 py-4 text-sm font-semibold text-white">
                <span className="flex-1">{item.question}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-180" />
              </summary>
              <p className="max-w-2xl pb-4 pr-8 text-sm leading-relaxed text-white/60">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">¿Necesitás ayuda personalizada?</p>
          <p className="text-xs text-white/50">Escribinos y contanos qué necesitás resolver.</p>
        </div>
        <a
          href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('Ayuda con PasantIA')}`}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          <Mail className="h-4 w-4" /> Contactar
        </a>
      </section>
    </div>
  );
}

function NotificationSetupCard({ platform }: { platform: 'android' | 'ios' }) {
  const isIos = platform === 'ios';
  const steps = isIos
    ? [
        'Abrí PasantIA en Safari.',
        'Tocá Compartir y elegí “Agregar a inicio”.',
        'Abrí PasantIA desde el ícono creado.',
        'Entrá a Ayuda y tocá “Activar notificaciones”.',
      ]
    : [
        'Abrí PasantIA en Chrome.',
        'Entrá a Ayuda y tocá “Activar notificaciones”.',
        'Elegí “Permitir” cuando Android lo solicite.',
      ];

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
          <Smartphone className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">{isIos ? 'iPhone · iOS' : 'Android'}</h3>
          <p className="text-[11px] text-white/45">
            {isIos ? 'Requiere agregar PasantIA a inicio' : 'Activación directa desde Chrome'}
          </p>
        </div>
      </div>

      <div className="mx-auto my-4 w-[10.5rem] rounded-[1.6rem] border-4 border-slate-900 bg-white p-2 shadow-lg">
        <div className="flex h-5 items-center justify-between px-2 text-[6px] font-bold text-slate-700">
          <span>9:41</span><span>● ●</span>
        </div>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-800">
          <div className="flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-md bg-brand-500 text-[8px] font-black text-white">P</span><span className="text-[7px] font-bold">PasantIA</span></div>
          {isIos ? (
            <div className="mt-3 rounded-lg bg-white p-2 shadow-sm">
              <p className="text-center text-[7px] font-bold">Compartir</p>
              <div className="mt-2 flex items-center gap-2 rounded-md border p-2"><Plus className="h-3 w-3 text-brand-500" /><span className="text-[6px] font-semibold">Agregar a inicio</span></div>
              <div className="mt-2 flex justify-center"><Share2 className="h-4 w-4 text-brand-500" /></div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-white p-2 text-center shadow-sm">
              <Bell className="mx-auto h-4 w-4 text-brand-500" />
              <p className="mt-1 text-[7px] font-bold">¿Permitir notificaciones?</p>
              <div className="mt-2 grid grid-cols-2 gap-1"><span className="rounded bg-slate-100 py-1 text-[6px]">Ahora no</span><span className="rounded bg-brand-500 py-1 text-[6px] font-bold text-white">Permitir</span></div>
            </div>
          )}
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-xs leading-relaxed text-white/65">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold !text-white">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}