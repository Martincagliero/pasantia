import { CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Card, PageHeader } from '../ui/primitives';
import { activePlan, planLabel, planPrice } from '../../lib/plans';
import type { Role, SubscriptionPlan } from '../../lib/database.types';
import { UpgradePrompt } from './UpgradePrompt';

const STUDENT_PLANS = [
  {
    plan: 'free' as const,
    name: 'Estudiante Gratis',
    features: ['1 postulación por mes', 'Hasta 5 conexiones nuevas por mes', 'Mensajes con conexiones aceptadas', 'Perfil público, comunidades y red'],
  },
  {
    plan: 'pro' as const,
    name: 'Estudiante Pro',
    features: ['Postulaciones ilimitadas', 'Conexiones sin límite', 'Mensajes sin conexión previa', 'Podés solicitar ser promotor/a', 'Mayor visibilidad del perfil'],
  },
];

const COMPANY_PLANS = [
  {
    plan: 'free' as const,
    name: 'Empresa Gratis',
    features: ['3 pasantías por mes', 'Primeros 3 postulados por pasantía', 'Perfil de empresa'],
  },
  {
    plan: 'pro' as const,
    name: 'Empresa Pro',
    features: ['Publicaciones ilimitadas', 'Todos los postulados y gestión completa', 'Búsqueda y contacto de talento', 'Mensajería y estadísticas'],
  },
  {
    plan: 'enterprise' as const,
    name: 'Plan Empresa',
    features: ['Múltiples usuarios', 'Marca empleadora', 'Soporte prioritario', 'Reportes personalizados'],
  },
];

const AMBASSADOR_PLANS = [
  {
    plan: 'free' as const,
    name: 'Embajador Gratis',
    features: ['Perfil de comunidad', 'Publicación de anuncios', 'Directorio y ranking de comunidades'],
  },
  {
    plan: 'pro' as const,
    name: 'Embajador Premium',
    features: ['Todo lo incluido en Gratis', 'Acompañamiento en campañas', 'Reportes de alcance', 'Soporte prioritario'],
  },
];

export default function PlansPage() {
  const { profile } = useAuth();
  const role: Role = profile?.role ?? 'estudiante';
  const current = activePlan(profile);
  const plans = role === 'empresa' ? COMPANY_PLANS : role === 'embajador' ? AMBASSADOR_PLANS : STUDENT_PLANS;

  return (
    <div>
      <PageHeader
        title="Planes PasantIA"
        description="Elegí las herramientas que necesitás. Los precios se cobran en pesos al valor de referencia en USD."
      />
      <div className={`grid gap-4 ${plans.length === 3 ? 'lg:grid-cols-3' : 'mx-auto max-w-3xl sm:grid-cols-2'}`}>
        {plans.map((item) => (
          <PlanCard key={item.plan} role={role} current={current} {...item} />
        ))}
      </div>
      {role === 'empresa' && (
        <Card className="mx-auto mt-5 max-w-3xl">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <div>
              <h2 className="font-semibold text-white">Publicaciones destacadas</h2>
              <p className="mt-1 text-sm text-white/60">Ubicá una pasantía primero en Inicio, búsquedas y comunidades: USD 25 por 15 días o USD 40 por 30 días.</p>
              <p className="mt-2 text-xs text-white/45">Podés solicitar el destacado desde “Mis pasantías”.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function PlanCard({
  role,
  plan,
  name,
  features,
  current,
}: {
  role: Role;
  plan: SubscriptionPlan;
  name: string;
  features: string[];
  current: SubscriptionPlan;
}) {
  const active = plan === current;
  return (
    <Card className={`relative flex flex-col ${plan !== 'free' ? 'border-2 border-white/30' : ''}`}>
      {plan !== 'free' && <span className="absolute right-4 top-4 text-[10px] font-semibold uppercase text-white/45">Recomendado</span>}
      <h2 className="pr-24 text-lg font-semibold text-white">{name}</h2>
      <p className="mt-2 text-2xl font-bold text-white">{planPrice(role, plan)}</p>
      <div className="mt-4 flex-1 space-y-2.5">
        {features.map((feature) => (
          <p key={feature} className="flex items-start gap-2 text-sm text-white/65">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/65" /> {feature}
          </p>
        ))}
      </div>
      {active ? (
        <span className="mt-5 inline-flex w-fit rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/60">
          Plan actual: {planLabel(plan, role)}
        </span>
      ) : plan !== 'free' ? (
        <div className="mt-5">
          <UpgradePrompt title={`Pasar a ${name}`} description="Enviá la solicitud y el equipo de PasantIA se contactará para activar el plan." plan={plan} planName={planLabel(plan, role)} compact />
        </div>
      ) : null}
    </Card>
  );
}