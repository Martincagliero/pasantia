import { Building2, Users, Clock, Filter, GraduationCap } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { Section } from '../components/ui/Section';
import { PageHero } from '../components/sections/PageHero';
import { Accent } from '../components/ui/Accent';
import { BenefitsGrid } from '../components/sections/BenefitsGrid';
import { HowItWorks, type Step } from '../components/sections/HowItWorks';
import { EarlyAccessCTA } from '../components/sections/EarlyAccessCTA';
import { IMAGES } from '../lib/images';

const BENEFITS = [
  {
    icon: Filter,
    title: 'Candidatos filtrados',
    description:
      'Recibí perfiles que encajan con lo que buscás, no una montaña de CVs sin criterio.',
  },
  {
    icon: Clock,
    title: 'Menos tiempo de búsqueda',
    description:
      'Automatizamos la parte tediosa del reclutamiento para que te enfoques en decidir.',
  },
  {
    icon: GraduationCap,
    title: 'Conexión con estudiantes',
    description:
      'Acceso directo a talento joven activo, en carrera y con ganas de aprender.',
  },
  {
    icon: Users,
    title: 'Talento a tu medida',
    description:
      'Definís qué buscás y te conectamos con los perfiles más relevantes para tu equipo.',
  },
];

const STEPS: Step[] = [
  {
    title: 'Creás el perfil de tu empresa',
    description:
      'Contás quiénes son, qué hacen y qué tipo de pasante buscan. Rápido y sin fricción.',
    image: IMAGES.modernOffice,
    imageAlt: 'Oficina moderna de una empresa',
  },
  {
    title: 'Publicás lo que necesitás',
    description:
      'Definís el rol, el área y el perfil. Nosotros nos encargamos de encontrar a los candidatos correctos.',
    image: IMAGES.meeting,
    imageAlt: 'Equipo definiendo una búsqueda',
  },
  {
    title: 'Recibís candidatos que encajan',
    description:
      'Te llegan perfiles ya filtrados por carrera, intereses y disponibilidad. Elegís a quién contactar.',
    image: IMAGES.interview,
    imageAlt: 'Entrevista con un candidato joven',
  },
  {
    title: 'Sumás talento a tu equipo',
    description:
      'Coordinás la entrevista y, si hay match, arranca la pasantía. Talento joven, sin la vuelta larga.',
    image: IMAGES.officeTeam,
    imageAlt: 'Nuevo pasante integrándose al equipo',
  },
];

export default function Empresas() {
  useSeo({
    title: 'Para empresas',
    description:
      'Encontrá talento joven filtrado y ahorrá tiempo de reclutamiento. Sumá tu empresa al acceso anticipado de PasantIA.',
    path: '/empresas',
  });

  return (
    <>
      <PageHero
        badge="Para empresas"
        badgeIcon={<Building2 size={13} />}
        headlineLines={['El talento joven', <Accent key="a">que tu equipo necesita.</Accent>]}
        subtitle="Accedé a candidatos filtrados, ahorrá tiempo en tu proceso de reclutamiento y conectá directo con estudiantes activos."
        role="empresa"
        image={IMAGES.officeTeam}
        imageAlt="Equipo de trabajo joven en una oficina moderna"
      />

      {/* Perspectiva de la empresa */}
      <Section className="bg-brand-950/30">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
            Para qué sirve
          </span>
          <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Reclutar talento joven, <Accent>sin la vuelta larga.</Accent>
          </h2>
          <p className="mt-6 text-lg font-light leading-relaxed text-white/70">
            PasantIA te conecta con estudiantes activos y filtrados según lo que buscás.
            En lugar de revisar cientos de CVs, recibís perfiles relevantes y decidís
            con quién avanzar. Ahorrás tiempo y llegás antes al talento correcto.
          </p>
        </div>
      </Section>

      {/* Beneficios */}
      <Section>
        <BenefitsGrid
          eyebrow="Beneficios"
          heading={<>Reclutamiento, <Accent>simplificado.</Accent></>}
          benefits={BENEFITS}
        />
      </Section>

      {/* Cómo va a funcionar para tu empresa */}
      <Section className="bg-brand-950/30">
        <HowItWorks
          eyebrow="Cómo va a funcionar para tu empresa"
          heading={<>De la búsqueda al match, <Accent>en 4 pasos.</Accent></>}
          subheading="Estamos construyendo el sistema completo. Así va a ser tu experiencia."
          steps={STEPS}
        />
      </Section>

      {/* CTA final */}
      <Section contained={false}>
        <EarlyAccessCTA
          heading={<>Sumá a tu empresa <Accent>a la lista.</Accent></>}
          subheading="Anotate en el acceso anticipado y sé de las primeras empresas en encontrar talento con PasantIA."
          role="empresa"
        />
      </Section>
    </>
  );
}
