import {
  GraduationCap,
  Search,
  BadgeCheck,
  Rocket,
  Target,
} from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { Section } from '../components/ui/Section';
import { PageHero } from '../components/sections/PageHero';
import { Accent } from '../components/ui/Accent';
import { BenefitsGrid } from '../components/sections/BenefitsGrid';
import { HowItWorks, type Step } from '../components/sections/HowItWorks';
import { EarlyAccessCTA } from '../components/sections/EarlyAccessCTA';
import { IMAGES } from '../lib/images';
import estudianteImg from '../assets/images/estudiante.jpg';

const BENEFITS = [
  {
    icon: Search,
    title: 'Pasantías reales',
    description:
      'Oportunidades concretas y vigentes, no promesas. Todo lo que ves se puede postular.',
  },
  {
    icon: BadgeCheck,
    title: 'Empresas verificadas',
    description:
      'Cada empresa pasa por una validación. Sabés con quién te estás postulando.',
  },
  {
    icon: Target,
    title: 'Sin CV a ciegas',
    description:
      'Nada de mandar tu currículum al vacío. Te conectamos con lo que encaja con vos.',
  },
  {
    icon: Rocket,
    title: 'Proceso simple',
    description:
      'Perfil rápido, postulación en un clic y seguimiento claro. Pensado para vos.',
  },
];

const STEPS: Step[] = [
  {
    title: 'Creás tu perfil',
    description:
      'Contanos qué estudiás, qué te interesa y qué buscás. En minutos quedás listo para postular.',
    image: IMAGES.studentLaptop,
    imageAlt: 'Estudiante creando su perfil en la notebook',
  },
  {
    title: 'Te mostramos pasantías que encajan',
    description:
      'Recibís oportunidades relevantes según tu carrera, tus intereses y tu zona. Sin ruido.',
    image: IMAGES.studying,
    imageAlt: 'Estudiante revisando oportunidades',
  },
  {
    title: 'Postulás con un clic',
    description:
      'Cuando algo te cierra, te postulás al instante. Sin formularios eternos ni vueltas.',
    image: IMAGES.studentGroup,
    imageAlt: 'Estudiantes postulándose desde el celular',
  },
  {
    title: 'Arrancás tu experiencia',
    description:
      'Coordinás la entrevista y, si hay match, empezás. Tu primera experiencia real, en serio.',
    image: IMAGES.heroOffice,
    imageAlt: 'Joven en su primer día de pasantía',
  },
];

export default function Estudiantes() {
  useSeo({
    title: 'Para estudiantes',
    description:
      'Accedé a pasantías reales en empresas verificadas, sin mandar CV a ciegas. Sumate al acceso anticipado de PasantIA.',
    path: '/estudiantes',
  });

  return (
    <>
      <PageHero
        badge="Para estudiantes"
        badgeIcon={<GraduationCap size={13} />}
        headlineLines={['Tu primera pasantía,', <Accent key="a">sin vueltas.</Accent>]}
        subtitle="Accedé a pasantías reales en empresas verificadas. Un proceso simple, directo y sin mandar CVs a ciegas."
        role="estudiante"
        image={estudianteImg}
        imageAlt="Estudiante con mochila y cuadernos en el campus"
        imageClassName="aspect-[3/4] object-top"
      />

      {/* Qué es PasantIA desde la perspectiva del estudiante */}
      <Section className="bg-brand-950/30">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
            Para qué sirve
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Encontrar una pasantía <Accent>debería ser simple.</Accent>
          </h2>
          <p className="mt-6 text-lg font-light leading-relaxed text-white/70">
            PasantIA te acerca oportunidades reales de empresas verificadas, filtradas
            según tu carrera e intereses. Nada de aplicar a cientos de avisos y quedarte
            sin respuesta: te conectamos directo con lo que tiene sentido para vos.
          </p>
        </div>
      </Section>

      {/* Beneficios */}
      <Section>
        <BenefitsGrid
          eyebrow="Beneficios"
          heading={<>Todo <Accent>a tu favor.</Accent></>}
          benefits={BENEFITS}
        />
      </Section>

      {/* Cómo va a funcionar para vos */}
      <Section className="bg-brand-950/30">
        <HowItWorks
          eyebrow="Cómo va a funcionar para vos"
          heading={<>Tu camino, <Accent>paso a paso.</Accent></>}
          subheading="Estamos construyendo el sistema completo. Así va a ser tu experiencia."
          steps={STEPS}
        />
      </Section>

      {/* CTA final */}
      <Section contained={false}>
        <EarlyAccessCTA
          heading={<>Anotate para <Accent>entrar primero.</Accent></>}
          subheading="Sumate a la lista de acceso anticipado como estudiante y te avisamos apenas lancemos."
          role="estudiante"
        />
      </Section>
    </>
  );
}
