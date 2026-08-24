import { motion } from 'framer-motion';
import {
  GraduationCap,
  Building2,
  ArrowRight,
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
import { useEarlyAccess } from '../components/early-access/EarlyAccess';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Reveal } from '../components/ui/Reveal';
import { Glow } from '../components/ui/Glow';
import { Marquee } from '../components/ui/Marquee';
import { Accordion } from '../components/ui/Accordion';
import { AnimatedHeadline } from '../components/ui/AnimatedHeadline';
import { Accent } from '../components/ui/Accent';
import { Typewriter } from '../components/ui/Typewriter';
import { HowItWorks, type Step } from '../components/sections/HowItWorks';
import { EarlyAccessCTA } from '../components/sections/EarlyAccessCTA';
import { PlatformShowcase } from '../components/sections/PlatformShowcase';
import { InteractiveAppPreview } from '../components/sections/InteractiveAppPreview';
import { InstallAppSection } from '../components/sections/InstallAppSection';
import { PricingPlans } from '../components/sections/PricingPlans';
import { LaunchCountdown } from '../components/sections/LaunchCountdown';
import { IMAGES, AVATARS } from '../lib/images';
import estudianteImg from '../assets/images/estudiante.webp';
import iconosHero from '../assets/images/iconos-hero.png';

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
      'Podés empezar gratis. Estudiante Pro cuesta $7.500 por mes, Empresa Pro $73.500 por mes y el plan Empresa parte de $223.500 por mes.',
  },
  {
    question: '¿Es para estudiantes o para empresas?',
    answer:
      'Para ambos. Los estudiantes acceden a pasantías reales y verificadas; las empresas encuentran talento joven filtrado y ahorran tiempo de reclutamiento.',
  },
  {
    question: '¿Cómo me sumo al acceso anticipado?',
    answer:
      'Con el botón de acceso anticipado de esta página. Te anotás en la lista y te avisamos apenas abramos el acceso.',
  },
];

export default function Home() {
  useSeo({
    title: 'Conectamos estudiantes con empresas',
    description:
      'PasantIA es la plataforma que conecta estudiantes con empresas para gestionar pasantías. Sumate al acceso anticipado.',
    path: '/',
  });

  const { open: openEarlyAccess } = useEarlyAccess();

  return (
    <>
      {/* ===================== HERO + PREVIEW INTERACTIVA ===================== */}
      <section className="relative min-h-[100svh] overflow-hidden pb-2 pt-[4.5rem] md:flex md:items-center md:pb-6 md:pt-20 xl:pb-10 xl:pt-24">
        <Glow className="left-1/2 top-16 h-[20rem] w-[20rem] -translate-x-1/2 sm:h-[34rem] sm:w-[34rem]" />
        <Glow
          className="right-10 top-1/3 h-56 w-56 sm:h-72 sm:w-72"
          color="rgba(125,156,255,0.22)"
        />

        <div className="container-px">
          <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.6fr)] md:gap-8 lg:gap-12">
            <div className="hidden text-left md:block">
            {/* Headline con iconos de referentes al lado de "pasantía" */}
            <div className="relative w-full">
              <AnimatedHeadline
                lines={[
                  <span key="l1" className="flex flex-wrap items-center justify-start gap-x-3 gap-y-2">
                    <span className="whitespace-nowrap">La pasantía</span>
                    <img
                      src={iconosHero}
                      alt="Mercado Libre, Globant, UADE"
                      className="inline-block h-[1.5em] w-auto align-middle sm:h-[1.2em] lg:h-[1.05em]"
                    />
                  </span>,
                  'que buscabas,',
                  <span key="tw" className="block min-h-[2.1em] whitespace-normal sm:min-h-0 sm:whitespace-nowrap">
                    <Typewriter
                      words={['sin buscar a ciegas.', 'sin caos.', 'sin vueltas.', 'sin CVs al vacío.', 'sin LinkedIn.']}
                      className="font-light text-white/95"
                    />
                  </span>,
                ]}
                delay={0.15}
                className="text-[2.75rem] font-semibold leading-[0.96] tracking-tightest text-white lg:text-[4rem] xl:text-[4.6rem]"
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-6 max-w-lg text-base font-light leading-relaxed text-white/70 lg:text-lg"
            >
              Conectá con empresas verificadas, gestioná todo desde un mismo lugar y
              arrancá tu pasantía.
            </motion.p>

            {/* Fila de confianza: avatares apilados + divisor + estado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="mt-7 flex items-center gap-5 lg:gap-6"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex -space-x-2.5">
                  {AVATARS.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="h-8 w-8 rounded-full border-2 border-brand-500 object-cover sm:h-9 sm:w-9"
                    />
                  ))}
                </div>
                <span className="text-xs leading-tight text-white/60 lg:text-sm">
                  Estudiantes y empresas
                  <br className="hidden sm:block" /> en un mismo lugar
                </span>
              </div>

              <div className="h-8 w-px bg-white/15" />

              <LaunchCountdown compact />
            </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.2 }}
              className="relative flex flex-col items-center md:pr-12 xl:pr-16"
            >
              <div className="mb-2 text-center md:hidden">
                <h1 className="text-[1.75rem] font-semibold leading-[0.98] tracking-tighter text-white">
                  <span className="block"><span className="font-normal">Conectamos</span> estudiantes</span>
                  <span className="mt-1 block font-light text-white/85">
                    con <span className="font-semibold text-white">empresas</span>
                  </span>
                </h1>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 12, rotate: 5 }}
                animate={{ opacity: 1, x: 0, rotate: 3, y: [0, -3, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: 1.15 },
                  x: { duration: 0.5, delay: 1.15 },
                  rotate: { duration: 0.5, delay: 1.15 },
                  y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.7 },
                }}
                className="pointer-events-none relative z-30 mb-1 self-end pr-4 text-right text-white md:absolute md:right-0 md:top-[8.5rem] md:mb-0 md:max-w-[7.5rem] md:self-auto md:pr-0"
                aria-label="Más de 100 estudiantes ya se registraron"
              >
                <p className="font-['Caveat'] text-sm font-semibold leading-[0.9] drop-shadow-md sm:text-base md:text-sm xl:text-base">
                  +100 estudiantes
                  <br />
                  <span className="font-medium text-white/85">ya se registraron</span>
                </p>
                <svg viewBox="0 0 130 14" className="ml-auto mt-1 h-2.5 w-20 xl:w-24" fill="none" aria-hidden>
                  <motion.path
                    d="M3 9C35 3 83 5 127 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.75 }}
                    transition={{ duration: 0.8, delay: 1.55 }}
                  />
                </svg>
              </motion.div>
              <InteractiveAppPreview variant="hero" />
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-1.5 md:hidden">
                <LaunchCountdown compact />
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 md:hidden">
                <Button
                  as="link"
                  to="/ingresar"
                  variant="secondary"
                  size="sm"
                  className="!h-9 justify-center px-4 text-xs"
                >
                  Ingresar
                </Button>
                <Button
                  onClick={() => openEarlyAccess()}
                  variant="landing"
                  size="sm"
                  className="!h-9 justify-center px-4 text-xs"
                >
                  Registrarme
                  <ArrowRight size={14} />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== POR QUÉ PASANTIA (solo mobile: 2da sección) ===================== */}
      <Section className="md:hidden">
        <PlatformShowcase />
      </Section>

      <div className="md:hidden">
        <PricingPlans id="planes" />
      </div>

      {/* ===================== TIRA DE RUBROS (estilo tira de marcas go-marz) ===================== */}
      <div className="bg-white py-12 text-brand-700 sm:py-16 md:bg-transparent md:text-white">
        <p className="container-px mb-10 text-center text-xs font-bold uppercase tracking-[0.2em] text-brand-700/55 md:text-white/50">
          Pasantías en todos los rubros
        </p>
        <Marquee
          speed={40}
          items={MARQUEE_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-8 text-brand-700/55 transition-colors duration-300 hover:text-brand-900 md:text-white/45 md:hover:text-white"
            >
              <Icon size={26} strokeWidth={1.75} />
              <span className="text-2xl font-semibold tracking-tight">{label}</span>
            </div>
          ))}
        />
      </div>

      {/* ===================== EL PROBLEMA ===================== */}
      <Section className="bg-white text-brand-800 md:bg-transparent md:text-white">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700/55 md:text-white/50">
              El problema
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
              Encontrar una pasantía real{' '}
              <Accent className="!text-brand-600 md:!text-white/95">cuesta demasiado.</Accent>
            </h2>
            <p className="mt-6 text-lg font-light leading-relaxed text-brand-800/70 md:text-white/70">
              A los estudiantes les cuesta encontrar pasantías relevantes: mandan
              CVs a ciegas y casi nunca reciben respuesta. A las empresas les cuesta
              encontrar talento joven de forma ágil, perdiendo tiempo entre cientos
              de perfiles que no encajan.
            </p>
            <p className="mt-4 text-lg font-light leading-relaxed text-brand-800/70 md:text-white/70">
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
      <Section className="bg-white text-brand-800 md:bg-transparent md:text-white">
        <Reveal className="mx-auto max-w-5xl text-center">
          <h2 className="text-6xl font-semibold leading-[0.92] tracking-tightest sm:text-8xl lg:text-[8.5rem]">
            No más
            <br />
            CVs
            <br />
            <Accent className="!text-brand-600 md:!text-white/95">a ciegas.</Accent>
          </h2>
          <p className="mx-auto mt-10 max-w-xl text-lg font-light text-brand-800/65 md:text-white/65">
            Basta de mandar tu currículum al vacío o de revisar cientos de perfiles
            que no encajan. PasantIA conecta a los dos lados de forma directa.
          </p>
        </Reveal>
      </Section>

      {/* ===================== POR QUÉ PASANTIA ===================== */}
      {/* ===================== POR QUÉ PASANTIA (desktop: en su posición original) ===================== */}
      <Section className="hidden md:block">
        <PlatformShowcase />
      </Section>

      <div className="hidden md:block">
        <PricingPlans id="planes-desktop" />
      </div>

      {/* ===================== CÓMO FUNCIONA ===================== */}
      <Section id="como-funciona" className="bg-white text-brand-800">
        <HowItWorks
          eyebrow="Cómo funciona"
          heading={
            <>
              De registrarte a arrancar,{' '}
              <Accent className="!text-brand-600">en 4 pasos.</Accent>
            </>
          }
          subheading="El sistema completo con perfiles, matching y postulación está en camino. Así se va a sentir."
          steps={STEPS}
          inverted
        />
      </Section>

      {/* ===================== INSTALAR COMO APP ===================== */}
      <InstallAppSection />

      {/* ===================== DOBLE CTA ESTUDIANTE / EMPRESA ===================== */}
      <Section className="bg-white text-brand-800">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tighter sm:text-5xl">
            ¿De qué lado <Accent className="!text-brand-600">estás?</Accent>
          </h2>
          <p className="mt-5 text-lg font-light text-brand-800/70">
            Elegí tu camino y descubrí cómo PasantIA trabaja para vos.
          </p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              to: '/estudiantes',
              icon: GraduationCap,
              title: 'Soy estudiante',
              desc: 'Accedé a pasantías reales, en empresas verificadas, sin mandar CVs a ciegas.',
              img: estudianteImg,
              imgClass: 'object-top',
              isButton: false,
            },
            {
              to: '/empresas',
              icon: Building2,
              title: 'Soy empresa',
              desc: 'Encontrá talento joven filtrado y ahorrá tiempo en tu proceso de reclutamiento.',
              img: IMAGES.officeTeam,
              imgClass: 'object-center',
              isButton: false,
            },
            {
              to: '/',
              icon: Megaphone,
              title: 'Soy comunidad / embajador',
              desc: 'Comparte oportunidades con tu comunidad y ganate puntos y reconocimiento.',
              img: IMAGES.ambassadorCommunity,
              imgClass: 'object-center',
              isButton: true,
            },
          ].map((card) => (
            <Reveal key={card.to + card.title}>
              {card.isButton ? (
                <button
                  onClick={() => openEarlyAccess('embajador')}
                  className="group relative block w-full overflow-hidden rounded-[2rem] border border-white/12 text-left"
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
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                      <card.icon size={22} />
                    </span>
                    <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
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
                </button>
              ) : (
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
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                      <card.icon size={22} />
                    </span>
                    <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
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
              )}
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== FAQ ===================== */}
      <Section id="faqs" className="bg-white text-brand-800">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700/55">
              Preguntas frecuentes
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
              Lo que <Accent className="!text-brand-600">querés saber.</Accent>
            </h2>
            <p className="mt-5 text-lg font-light text-brand-800/70">
              ¿Te quedó una duda? Escribinos a nuestro mail.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion items={FAQ} />
          </Reveal>
        </div>
      </Section>

      {/* ===================== CTA FINAL ===================== */}
      <Section contained={false} className="bg-white text-brand-800">
        <EarlyAccessCTA
          heading={
            <>
              Sumate al <Accent className="!text-brand-600">acceso anticipado.</Accent>
            </>
          }
          subheading="Sé de los primeros en entrar cuando lancemos. Dejanos tus datos y te contactamos apenas abramos el acceso."
          inverted
        />
      </Section>
    </>
  );
}
