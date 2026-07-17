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
import { IMAGES, AVATARS } from '../lib/images';
import appPreview from '../assets/images/2daseccion.png';
import estudianteImg from '../assets/images/estudiante.jpg';
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
      'Con el botón de acceso anticipado de esta página. Te anotás en la lista y te avisamos apenas abramos el acceso.',
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
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-52 sm:pb-32">
        <Glow className="left-1/2 top-16 h-[20rem] w-[20rem] -translate-x-1/2 sm:h-[34rem] sm:w-[34rem]" />
        <Glow
          className="right-10 top-1/3 h-56 w-56 sm:h-72 sm:w-72"
          color="rgba(125,156,255,0.22)"
        />

        <div className="container-px">
          <div className="relative mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center text-center sm:min-h-0 sm:justify-start">
            {/* Headline con iconos de referentes al lado de "pasantía" */}
            <div className="relative w-full">
              <AnimatedHeadline
                lines={[
                  <span
                    key="l1"
                    className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
                  >
                    <span className="whitespace-nowrap">La pasantía</span>
                    <img
                      src={iconosHero}
                      alt="Mercado Libre, Globant, UADE"
                      className="inline-block h-[1.5em] w-auto align-middle sm:h-[1.2em] lg:h-[1.05em]"
                    />
                  </span>,
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
                className="text-[2.6rem] font-semibold leading-[1] tracking-tightest text-white xs:text-[3.25rem] xs:leading-[0.95] sm:text-6xl lg:text-[6.5rem]"
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/60 sm:mt-8 sm:text-xl sm:text-white/70"
            >
              Conectá con empresas verificadas, gestioná todo desde un mismo lugar y
              arrancá tu pasantía.
            </motion.p>

            {/* CTAs centrados con glow bajo el primario */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85 }}
              className="relative mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row"
            >
              <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-24 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
              <div className="[&>*]:w-full sm:[&>*]:w-auto">
                <Button
                  as="link"
                  to="/estudiantes"
                  size="lg"
                  className="w-full justify-center max-sm:!h-11 sm:w-auto"
                >
                  <GraduationCap size={20} />
                  Soy estudiante
                </Button>
              </div>
              <div className="[&>*]:w-full sm:[&>*]:w-auto">
                <Button
                  as="link"
                  to="/empresas"
                  variant="secondary"
                  size="lg"
                  className="w-full justify-center max-sm:!h-11 sm:w-auto"
                >
                  <Building2 size={20} />
                  Soy empresa
                </Button>
              </div>
            </motion.div>

            {/* Fila de confianza: avatares apilados + divisor + estado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="mt-7 flex flex-col items-center gap-5 sm:mt-10 sm:flex-row sm:gap-6"
            >
              <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
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
                <span className="text-sm leading-tight text-white/60 sm:text-left">
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
        <PlatformShowcase />
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
              ¿Te quedó una duda? Escribinos a nuestro mail.
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
