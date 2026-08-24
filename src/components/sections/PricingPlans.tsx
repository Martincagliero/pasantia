import { useState } from 'react';
import { Building2, Check, Crown, GraduationCap, Sparkles } from 'lucide-react';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Accent } from '../ui/Accent';
import { useEarlyAccess } from '../early-access/EarlyAccess';

type Audience = 'estudiantes' | 'empresas';

const studentPlans = [
  {
    name: 'Gratis',
    price: 'USD 0',
    description: 'Para empezar a construir tu red y encontrar oportunidades.',
    features: ['5 conexiones nuevas por mes', 'Mensajes con conexiones aceptadas', 'Postulaciones y perfil público', 'Comunidades y red'],
  },
  {
    name: 'Pro',
    price: 'USD 5',
    suffix: '/mes',
    description: 'Para moverte sin límites y contactar antes que nadie.',
    featured: true,
    features: ['Conexiones sin límite', 'Mensajes sin conexión previa', 'Podés solicitar ser promotor/a', 'Mayor visibilidad del perfil', 'Soporte prioritario'],
  },
];

const companyPlans = [
  {
    name: 'Gratis',
    price: 'USD 0',
    description: 'Para publicar las primeras búsquedas y conocer PasantIA.',
    features: ['3 pasantías por mes', 'Perfil de empresa', 'Recepción básica de postulaciones'],
  },
  {
    name: 'Pro',
    price: 'USD 49',
    suffix: '/mes',
    description: 'Para contratar talento joven de forma continua.',
    featured: true,
    features: ['Publicaciones ilimitadas', 'Gestión y filtros de candidatos', 'Búsqueda y contacto de talento', 'Mensajería y estadísticas'],
  },
  {
    name: 'Empresa',
    price: 'Desde USD 149',
    suffix: '/mes',
    description: 'Para equipos con procesos y marca empleadora propios.',
    features: ['Múltiples usuarios', 'Marca empleadora', 'Soporte prioritario', 'Reportes personalizados'],
  },
];

export function PricingPlans({ id }: { id: string }) {
  const [audience, setAudience] = useState<Audience>('estudiantes');
  const { open } = useEarlyAccess();
  const plans = audience === 'estudiantes' ? studentPlans : companyPlans;

  return (
    <Section id={id} className="bg-white/[0.035] scroll-mt-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">Planes</span>
        <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
          Empezá gratis. <Accent>Crece cuando lo necesites.</Accent>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
          Herramientas claras para estudiantes y empresas, sin pagar antes de encontrar valor.
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-9 flex justify-center">
        <div className="inline-flex rounded-full border border-white/15 bg-black/15 p-1" aria-label="Tipo de plan">
          <AudienceButton active={audience === 'estudiantes'} onClick={() => setAudience('estudiantes')} icon={GraduationCap}>
            Estudiantes
          </AudienceButton>
          <AudienceButton active={audience === 'empresas'} onClick={() => setAudience('empresas')} icon={Building2}>
            Empresas
          </AudienceButton>
        </div>
      </Reveal>

      <div className={`mx-auto mt-8 grid max-w-6xl gap-4 ${plans.length === 3 ? 'lg:grid-cols-3' : 'max-w-4xl sm:grid-cols-2'}`}>
        {plans.map((plan, index) => (
          <Reveal key={`${audience}-${plan.name}`} delay={0.05 * index} className="h-full">
            <article className={`relative flex h-full flex-col rounded-lg border p-6 sm:p-7 ${plan.featured ? 'border-brand-300/55 bg-white/[0.1] shadow-xl shadow-brand-950/25' : 'border-white/12 bg-white/[0.045]'}`}>
              {plan.featured && (
                <span className="mb-5 inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase text-brand-200">
                  <Crown className="h-3.5 w-3.5" /> Más elegido
                </span>
              )}
              <h3 className="text-xl font-semibold text-white">
                {audience === 'estudiantes'
                  ? `Estudiante ${plan.name}`
                  : plan.name === 'Empresa'
                    ? 'Plan Empresa'
                    : `Empresa ${plan.name}`}
              </h3>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {plan.price}<span className="ml-1 text-sm font-normal text-white/45">{plan.suffix}</span>
              </p>
              <p className="mt-3 min-h-12 text-sm leading-relaxed text-white/55">{plan.description}</p>
              <div className="my-6 h-px bg-white/10" />
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => open()} variant={plan.featured ? 'landing' : 'secondary'} size="md" className="mt-7 w-full">
                {plan.name === 'Gratis' ? 'Empezar gratis' : 'Solicitar plan'}
              </Button>
            </article>
          </Reveal>
        ))}
      </div>

      {audience === 'empresas' && (
        <Reveal delay={0.15} className="mx-auto mt-5 flex max-w-3xl items-start justify-center gap-2 text-center text-sm text-white/55">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <p>También podés destacar una pasantía por 15 días a USD 25 o por 30 días a USD 40.</p>
        </Reveal>
      )}
    </Section>
  );
}

function AudienceButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof GraduationCap; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${active ? 'bg-white text-brand-700' : 'text-white/60 hover:text-white'}`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}