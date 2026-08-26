import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Building2, CheckCircle2, GraduationCap } from 'lucide-react';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Accent } from '../ui/Accent';
import { useEarlyAccess } from '../early-access/EarlyAccess';
import { useMediaQuery, useTouchDevice } from '../../hooks/useMediaQuery';

type Audience = 'estudiantes' | 'empresas';

const studentPlans = [
  {
    name: 'Gratis',
    description: 'Para empezar a construir tu red y encontrar oportunidades.',
    features: ['5 postulaciones por mes', '5 conexiones nuevas por mes', 'Mensajes con conexiones aceptadas', 'Perfil público, comunidades y red'],
  },
  {
    name: 'Pro',
    description: 'Para moverte sin límites y contactar antes que nadie.',
    featured: true,
    features: ['Postulaciones ilimitadas', 'Conexiones sin límite', 'Mensajes sin conexión previa', 'Perfil destacado primero en Explorar', 'Tilde Pro junto al nombre', 'Verificación de cuenta'],
  },
];

const companyPlans = [
  {
    name: 'Gratis',
    description: 'Para publicar las primeras búsquedas y conocer PasantIA.',
    features: ['3 pasantías por mes', 'Primeros 10 postulados por pasantía', 'Perfil de empresa'],
  },
  {
    name: 'Pro',
    description: 'Para contratar talento joven de forma continua.',
    featured: true,
    features: ['Publicaciones ilimitadas', 'Todos los postulados y gestión completa', 'Perfil destacado primero en Explorar', 'Tilde Pro junto al nombre', 'Verificación de cuenta', 'Mensajería y estadísticas'],
  },
  {
    name: 'Empresa',
    description: 'Para equipos con procesos y marca empleadora propios.',
    features: ['Matching con IA', 'Múltiples usuarios', 'Marca empleadora', 'Soporte prioritario', 'Reportes personalizados'],
  },
];

export function PricingPlans({ id }: { id: string }) {
  const transitionRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const [audience, setAudience] = useState<Audience>('estudiantes');
  const { open } = useEarlyAccess();
  const plans = audience === 'estudiantes' ? studentPlans : companyPlans;
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isTouchDevice = useTouchDevice();
  const animateWipe = isDesktop && !isTouchDevice;

  useEffect(() => {
    if (!animateWipe) return;

    const updateWipe = () => {
      if (!transitionRef.current || !wipeRef.current) return;
      const rect = transitionRef.current.getBoundingClientRect();
      const travel = window.innerHeight + rect.height;
      const progress = Math.min(Math.max((window.innerHeight - rect.top) / travel, 0), 1);
      const eased = progress * progress * (3 - 2 * progress);
      wipeRef.current.style.clipPath = `circle(${reduceMotion ? 150 : eased * 150}% at 50% 100%)`;
    };
    updateWipe();
    window.addEventListener('scroll', updateWipe, { passive: true });
    window.addEventListener('resize', updateWipe);
    return () => {
      window.removeEventListener('scroll', updateWipe);
      window.removeEventListener('resize', updateWipe);
    };
  }, [animateWipe, reduceMotion]);

  return (
    <div className="relative bg-brand-500">
    <Section id={id} className="scroll-mt-24">
      <div>
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">Planes</span>
        <h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">
          Empezá gratis. <Accent>Crece cuando lo necesites.</Accent>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-relaxed text-white/70 sm:text-lg">
          Herramientas claras para estudiantes y empresas según cada etapa.
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
            <article className={`relative flex h-full flex-col rounded-lg bg-white p-6 text-slate-950 sm:p-7 ${plan.featured ? 'border-[3px] border-slate-900' : 'border border-white'}`}>
              {plan.featured && (
                <span className="absolute right-0 top-0 rounded-bl-lg bg-slate-900 px-4 py-2 text-[11px] font-semibold uppercase text-white">
                  Popular
                </span>
              )}
              <h3 className="pr-20 text-xl font-semibold text-slate-950">
                {audience === 'estudiantes'
                  ? `Estudiante ${plan.name}`
                  : plan.name === 'Empresa'
                    ? 'Plan Empresa'
                    : `Empresa ${plan.name}`}
              </h3>
              <p className="mt-7 min-h-12 text-sm leading-relaxed text-slate-600">{plan.description}</p>
              <button
                type="button"
                onClick={() => open()}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                {plan.name === 'Gratis' ? 'Empezar gratis' : 'Solicitar plan'}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <div className="my-6 h-px bg-slate-200" />
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      </div>
    </Section>
    {animateWipe ? (
      <div ref={transitionRef} className="relative h-[80svh] min-h-[30rem] overflow-hidden bg-brand-500" aria-hidden>
        <div
          ref={wipeRef}
          className="absolute inset-0 bg-white [clip-path:circle(0%_at_50%_100%)] will-change-[clip-path]"
        />
      </div>
    ) : (
      <div className="relative h-[35vw] min-h-28 max-h-[30rem] overflow-hidden bg-brand-500" aria-hidden>
        <div className="absolute left-1/2 top-[3vw] aspect-square w-[89vw] -translate-x-1/2 rounded-full bg-white" />
      </div>
    )}
    </div>
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