import { motion } from 'framer-motion';
import {
  GraduationCap,
  Building2,
  ArrowRight,
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  Briefcase,
  Code2,
  Megaphone,
  Palette,
  Cog,
  Landmark,
  Users,
  BarChart3,
  ShoppingBag,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Reveal } from '../components/ui/Reveal';
import { Glow } from '../components/ui/Glow';
import { Marquee } from '../components/ui/Marquee';
import { GlassCard } from '../components/ui/GlassCard';
import { Accordion } from '../components/ui/Accordion';
import { AnimatedHeadline } from '../components/ui/AnimatedHeadline';
import { Accent } from '../components/ui/Accent';
import { Typewriter } from '../components/ui/Typewriter';
import { HowItWorks, type Step } from '../components/sections/HowItWorks';
import { EarlyAccessCTA } from '../components/sections/EarlyAccessCTA';
import { IMAGES, AVATARS } from '../lib/images';
import { fadeUp, staggerContainer, viewportOnce } from '../lib/motion';
import appPreview from '../assets/images/2daseccion.png';
import estudianteImg from '../assets/images/estudiante.jpg';

// Rubros como "logos" (ícono + palabra), estilo tira de marcas de go-marz.
const MARQUEE_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Code2, label: 'Tecnología' },
  { icon: Megaphone, label: 'Marketing' },
  { icon: Palette, label: 'Diseño' },
  { icon: Briefcase, label: 'Administración' },
  { icon: Cog, label: 'Ingeniería' },
  { icon: Landmark, label: 'Finanzas' },
  { icon: Users, label: 'Recursos Humanos' },
  { icon: BarChart3, label: 'Datos' },
  { icon: ShoppingBag, label: 'Comercial' },
  { icon: Scale, label: 'Legales' },
];

const STEPS: Step[] = [
  {
    title: 'Creás tu perfil',
    description:
      'Estudiantes y empresas se registran en minutos. Contás quién sos, qué buscás y qué te interesa. Sin CVs eternos ni formularios interminables.',
    image: IMAGES.profile,
    imageAlt: 'Persona creando su perfil en una notebook',
  },
  {
    title: 'Te matcheamos',
    description:
      'Nuestro sistema conecta estudiantes con las pasantías más relevantes según carrera, intereses y ubicación. La empresa recibe candidatos que encajan de verdad.',
    image: IMAGES.matching,
    imageAlt: 'Equipo analizando candidatos en una reunión',
  },
  {
    title: 'Postulás o recibís candidatos',
    description:
      'El estudiante postula con un clic a las oportunidades que le cierran. La empresa revisa perfiles ya filtrados y elige a quién contactar.',
    image: IMAGES.apply,
    imageAlt: 'Persona postulando desde su teléfono',
  },
  {
    title: 'Arrancás la pasantía',
    description:
      'Coordinan la entrevista y, si hay match, empieza la experiencia. El estudiante suma experiencia real; la empresa, talento joven con ganas.',
    image: IMAGES.start,
    imageAlt: 'Joven arrancando su primer día de trabajo',
  },
];

const FAQ = [
  {
    question: '¿Qué es PasantIA?',
    answer:
      'Una plataforma que conecta estudiantes con empresas para gestionar pasantías. Nuestro objetivo es que encontrar (u ofrecer) una pasantía deje de ser una búsqueda a ciegas.',
  },
  {
    question: '¿Ya puedo usar la plataforma?',
    answer:
      'Estamos en etapa de acceso anticipado. El sistema completo con perfiles, matching y postulación está en desarrollo. Sumándote a la lista sos de los primeros en entrar cuando lancemos.',
  },
  {
    question: '¿Tiene costo?',
    answer:
      'Sumarte a la lista de acceso anticipado es gratis. Los detalles de planes se comunicarán más adelante, con condiciones especiales para quienes nos acompañen desde el inicio.',
  },
  {
    question: '¿Es para estudiantes o para empresas?',
    answer:
      'Para ambos. Los estudiantes acceden a pasantías reales y verificadas; las empresas encuentran talento joven filtrado y ahorran tiempo de reclutamiento.',
  },
  {
    question: '¿Cómo me sumo al acceso anticipado?',
    answer:
      'Con el botón de WhatsApp de esta página. Nos escribís, te anotamos en la lista y te avisamos apenas abramos el acceso.',
  },
];

export default function Home() {
  useSeo({
    title: 'Conectamos estudiantes y empresas',
    description:
      'PasantIA es la plataforma que conecta estudiantes con empresas para gestionar pasantías. Sumate al acceso anticipado.',
    path: '/',
  });

  return (
    <>
      {/* ===================== HERO (inspirado en go-marz) ===================== */}
      <section className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
        <Glow className="left-1/2 top-16 h-[34rem] w-[34rem] -translate-x-1/2" />
        <Glow
          className="right-10 top-1/3 h-72 w-72"
          color="rgba(125,156,255,0.22)"
        />

        <div className="container-px">
          <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
            {/* Badge outline con punto de estado "en vivo" */}
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Lanzamiento en Argentina
            </motion.span>

            {/* Headline + cluster de íconos flotando (adaptación del cluster de plataformas) */}
            <div className="relative mt-7 w-full">
              <AnimatedHeadline
                lines={[
                  'La pasantía',
                  'que buscabas,',
                  <span
                    key="tw"
                    className="block min-h-[2.1em] whitespace-normal sm:min-h-0 sm:whitespace-nowrap"
                  >
                    <Typewriter
                      words={[
                        'sin buscar a ciegas.',
                        'sin caos.',
                        'sin vueltas.',
                        'sin CVs al vacío.',
                        'sin LinkedIn.',
                      ]}
                      className="font-light text-white/95"
                    />
                  </span>,
                ]}
                delay={0.15}
                className="text-[3.25rem] font-semibold leading-[0.95] tracking-tightest text-white sm:text-6xl lg:text-[6.5rem]"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute -top-9 right-0 hidden lg:block xl:-right-6"
                aria-hidden
              >
                <div className="relative flex items-center gap-3">
                  <div className="absolute -inset-6 -z-10 rounded-full bg-white/25 blur-2xl" />
                  {[GraduationCap, Building2, Briefcase].map((Icon, i) => (
                    <span
                      key={i}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-brand-600/80 text-white shadow-xl shadow-brand-950/50 backdrop-blur"
                    >
                      <Icon size={24} />
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-8 max-w-xl text-lg font-light leading-relaxed text-white/70 sm:text-xl"
            >
              Conectá con empresas verificadas, gestioná todo desde un mismo lugar y
              arrancá tu pasantía sin mandar CVs a ciegas.
            </motion.p>

            {/* CTAs centrados con glow bajo el primario */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85 }}
              className="relative mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-24 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
              <Button as="link" to="/estudiantes" size="lg">
                <GraduationCap size={20} />
                Soy estudiante
              </Button>
              <Button as="link" to="/empresas" variant="secondary" size="lg">
                <Building2 size={20} />
                Soy empresa
              </Button>
            </motion.div>

            {/* Fila de confianza: avatares apilados + divisor + estado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {AVATARS.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="h-9 w-9 rounded-full border-2 border-brand-500 object-cover"
                    />
                  ))}
                </div>
                <span className="text-left text-sm leading-tight text-white/60">
                  Estudiantes y empresas
                  <br className="hidden sm:block" /> en un mismo lugar
                </span>
              </div>

              <div className="hidden h-8 w-px bg-white/15 sm:block" />

              <div className="flex items-center gap-2 text-sm text-white/70">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Acceso anticipado abierto
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== 2DA SECCIÓN: PREVIEW DEL PRODUCTO (estilo Marz) ===================== */}
      {/* Imagen del usuario con bordes redondeados y máscara que la corta/difumina hacia el fondo. */}
      <section className="relative -mt-4 pb-8 sm:-mt-6 sm:pb-12">
        <div className="container-px">
          <Reveal>
            <div className="relative mx-auto max-w-6xl">
              <div className="absolute -inset-x-6 -top-8 bottom-0 -z-10 rounded-[3rem] bg-white/5 blur-3xl" />
              <img
                src={appPreview}
                alt="Vista previa de PasantIA: la app para estudiantes y el panel para empresas"
                loading="lazy"
                className="w-full rounded-t-[2rem] border-x border-t border-white/12"
                style={{
                  maskImage:
                    'linear-gradient(to bottom, #000 42%, rgba(0,0,0,0.55) 72%, transparent 96%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, #000 42%, rgba(0,0,0,0.55) 72%, transparent 96%)',
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== TIRA DE RUBROS (estilo tira de marcas go-marz) ===================== */}
      <div className="py-12 sm:py-16">
        <p className="container-px mb-10 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          Pasantías en todos los rubros
        </p>
        <Marquee
          speed={40}
          items={MARQUEE_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-8 text-white/45 transition-colors duration-300 hover:text-white"
            >
              <Icon size={26} strokeWidth={1.75} />
              <span className="text-2xl font-semibold tracking-tight">{label}</span>
            </div>
          ))}
        />
      </div>

      {/* ===================== EL PROBLEMA ===================== */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
              El problema
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
              Encontrar una pasantía real{' '}
              <Accent>cuesta demasiado.</Accent>
            </h2>
            <p className="mt-6 text-lg font-light leading-relaxed text-white/70">
              A los estudiantes les cuesta encontrar pasantías relevantes: mandan
              CVs a ciegas y casi nunca reciben respuesta. A las empresas les cuesta
              encontrar talento joven de forma ágil, perdiendo tiempo entre cientos
              de perfiles que no encajan.
            </p>
            <p className="mt-4 text-lg font-light leading-relaxed text-white/70">
              PasantIA existe para cerrar esa brecha con una conexión directa,
              simple y pensada para los dos lados.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative">
              <Glow className="-right-10 top-0 h-64 w-64" />
              <img
                src={IMAGES.heroStudents}
                alt="Grupo de estudiantes trabajando juntos"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-[1.75rem] border border-white/10 object-cover shadow-2xl shadow-brand-950/40"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ===================== STATEMENT GIGANTE (estilo go-marz) ===================== */}
      <Section>
        <Reveal className="mx-auto max-w-5xl text-center">
          <h2 className="text-6xl font-semibold leading-[0.92] tracking-tightest sm:text-8xl lg:text-[8.5rem]">
            No más
            <br />
            CVs
            <br />
            <Accent>a ciegas.</Accent>
          </h2>
          <p className="mx-auto mt-10 max-w-xl text-lg font-light text-white/65">
            Basta de mandar tu currículum al vacío o de revisar cientos de perfiles
            que no encajan. PasantIA conecta a los dos lados de forma directa.
          </p>
        </Reveal>
      </Section>

      {/* ===================== POR QUÉ PASANTIA ===================== */}
      <Section className="bg-brand-950/30">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
            Por qué PasantIA
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Una sola plataforma,{' '}
            <Accent>dos mundos que se encuentran.</Accent>
          </h2>
        </Reveal>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            {
              icon: Target,
              title: 'Relevante',
              desc: 'Conexiones según carrera, intereses y ubicación. Basta de aplicar a ciegas.',
            },
            {
              icon: ShieldCheck,
              title: 'Confiable',
              desc: 'Empresas verificadas y estudiantes reales. Un entorno serio para ambos.',
            },
            {
              icon: Zap,
              title: 'Ágil',
              desc: 'Menos fricción, menos tiempo perdido. Del match a la entrevista, rápido.',
            },
            {
              icon: Sparkles,
              title: 'Simple',
              desc: 'Una experiencia clara y moderna, pensada para tu primera experiencia laboral.',
            },
          ].map((b) => (
            <motion.div key={b.title} variants={fadeUp}>
              <GlassCard interactive className="h-full">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <b.icon size={22} />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-white/65">
                  {b.desc}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ===================== CÓMO VA A FUNCIONAR ===================== */}
      <Section id="como-funciona">
        <HowItWorks
          eyebrow="Cómo va a funcionar"
          heading={
            <>
              De registrarte a arrancar,{' '}
              <Accent>en 4 pasos.</Accent>
            </>
          }
          subheading="El sistema completo con perfiles, matching y postulación está en camino. Así se va a sentir."
          steps={STEPS}
        />
      </Section>

      {/* ===================== DOBLE CTA ESTUDIANTE / EMPRESA ===================== */}
      <Section className="bg-brand-950/30">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tighter sm:text-5xl">
            ¿De qué lado <Accent>estás?</Accent>
          </h2>
          <p className="mt-5 text-lg font-light text-white/70">
            Elegí tu camino y descubrí cómo PasantIA trabaja para vos.
          </p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-2">
          {[
            {
              to: '/estudiantes',
              icon: GraduationCap,
              title: 'Soy estudiante',
              desc: 'Accedé a pasantías reales, en empresas verificadas, sin mandar CVs a ciegas.',
              img: estudianteImg,
              imgClass: 'object-top',
            },
            {
              to: '/empresas',
              icon: Building2,
              title: 'Soy empresa',
              desc: 'Encontrá talento joven filtrado y ahorrá tiempo en tu proceso de reclutamiento.',
              img: IMAGES.officeTeam,
              imgClass: 'object-center',
            },
          ].map((card) => (
            <Reveal key={card.to}>
              <Link
                to={card.to}
                className="group relative block overflow-hidden rounded-[2rem] border border-white/12"
              >
                <img
                  src={card.img}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className={`h-[30rem] w-full object-cover sm:h-[34rem] ${card.imgClass} transition-transform duration-700 group-hover:scale-105`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <card.icon size={22} />
                  </span>
                  <h3 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {card.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-base font-light text-white/75">
                    {card.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    Ver más
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== FAQ ===================== */}
      <Section id="faqs">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
              Preguntas frecuentes
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
              Lo que <Accent>querés saber.</Accent>
            </h2>
            <p className="mt-5 text-lg font-light text-white/70">
              ¿Te quedó una duda? Escribinos por WhatsApp o a nuestro mail.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion items={FAQ} />
          </Reveal>
        </div>
      </Section>

      {/* ===================== CTA FINAL ===================== */}
      <Section contained={false}>
        <EarlyAccessCTA
          heading={
            <>
              Sumate al <Accent>acceso anticipado.</Accent>
            </>
          }
          subheading="Sé de los primeros en entrar cuando lancemos. Dejanos tus datos y te contactamos apenas abramos el acceso."
        />
      </Section>
    </>
  );
}
