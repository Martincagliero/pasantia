// Empresa: panel de resumen con métricas y últimas postulaciones.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Briefcase, CalendarDays, CheckCircle2, Clock, Plus, Send, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { ApplicationStatus } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../ui/primitives';
import { isPro } from '../../lib/plans';
import { UpgradePrompt } from '../plans/UpgradePrompt';
import { normalizeStatus, STATUS_META, type AppStatus } from '../ui/applicationStatus';

interface RecentApp {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  internship: { id: string; title: string } | null;
  student: { full_name: string } | null;
}

interface InternshipPerformance {
  id: string;
  title: string;
  applications: number;
}

const EMPTY_FUNNEL: Record<AppStatus, number> = {
  pendiente: 0,
  en_revision: 0,
  entrevista: 0,
  prueba_tecnica: 0,
  seleccionado: 0,
  rechazada: 0,
};

export default function CompanyOverview() {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, activas: 0, postulaciones: 0, pendientes: 0, last30Days: 0 });
  const [funnel, setFunnel] = useState<Record<AppStatus, number>>(EMPTY_FUNNEL);
  const [performance, setPerformance] = useState<InternshipPerformance[]>([]);
  const [recent, setRecent] = useState<RecentApp[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = session!.user.id;
      const [{ data: internships }, { data: apps }] = await Promise.all([
        supabase.from('internships').select('id, title, is_active').eq('company_id', uid),
        supabase
          .from('applications')
          .select('id, status, created_at, internship:internships(id, title, company_id), student:profiles(full_name)')
          .order('created_at', { ascending: false }),
      ]);
      if (!active) return;

      const list = internships ?? [];
      // applications ya viene filtrado por RLS a las pasantías de esta empresa.
      const applications = (apps ?? []) as unknown as RecentApp[];
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const nextFunnel = { ...EMPTY_FUNNEL };
      const applicationCountByInternship = new Map<string, number>();
      for (const application of applications) {
        nextFunnel[normalizeStatus(application.status)] += 1;
        if (application.internship?.id) {
          applicationCountByInternship.set(
            application.internship.id,
            (applicationCountByInternship.get(application.internship.id) ?? 0) + 1
          );
        }
      }

      setStats({
        total: list.length,
        activas: list.filter((i: { is_active: boolean }) => i.is_active).length,
        postulaciones: applications.length,
        pendientes: applications.filter((a) => a.status === 'pendiente').length,
        last30Days: applications.filter((application) => new Date(application.created_at).getTime() >= thirtyDaysAgo).length,
      });
      setFunnel(nextFunnel);
      setPerformance(
        list
          .map((internship: { id: string; title: string }) => ({
            id: internship.id,
            title: internship.title,
            applications: applicationCountByInternship.get(internship.id) ?? 0,
          }))
          .sort((left, right) => right.applications - left.applications)
          .slice(0, 4)
      );
      setRecent(applications.slice(0, 6));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  if (loading) return <PageLoader />;

  const firstName = (profile?.full_name || 'tu empresa').split(' ')[0];
  const paid = isPro(profile);
  const reviewed = stats.postulaciones - stats.pendientes;
  const reviewRate = stats.postulaciones > 0 ? Math.round((reviewed / stats.postulaciones) * 100) : 0;
  const selectedRate = stats.postulaciones > 0
    ? Math.round((funnel.seleccionado / stats.postulaciones) * 100)
    : 0;
  const funnelRows = [
    { label: 'Nuevos', value: funnel.pendiente },
    { label: 'En revisión', value: funnel.en_revision },
    { label: 'Entrevista y prueba', value: funnel.entrevista + funnel.prueba_tecnica },
    { label: 'Seleccionados', value: funnel.seleccionado },
  ];
  const funnelMax = Math.max(stats.postulaciones, 1);
  const performanceMax = Math.max(...performance.map((item) => item.applications), 1);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase text-white/45">Panel de empresa</p>
            {paid && <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-black text-white/60">PRO</span>}
          </div>
          <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{greeting}, {firstName}</h1>
          <p className="mt-1.5 text-sm text-white/60">
            {!paid
              ? 'Gestioná tus publicaciones y activá Empresa Pro para medir resultados.'
              : stats.pendientes > 0
              ? `Tenés ${stats.pendientes} postulación${stats.pendientes === 1 ? '' : 'es'} sin revisar.`
              : 'No tenés postulaciones pendientes. Todo al día.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {paid && <Button as="link" to="/app/explorar" variant="secondary" size="md">Explorar talento</Button>}
          <Button as="link" to="/app/publicar" variant="primary" size="md">
            <Plus className="h-4 w-4" /> Publicar pasantía
          </Button>
        </div>
      </div>

      {paid ? (
        <section className="overflow-hidden rounded-lg border border-[#24272e] bg-[#111317] shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-3 border-b border-[#24272e] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-semibold text-[#f4f6f8]">Pulso de contratación</p>
              <p className="mt-0.5 text-xs text-[#8e96a3]">Vista general de todas tus búsquedas</p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 text-[11px] text-[#707887]">
              <Activity className="h-3.5 w-3.5 text-[#4b9cff]" /> Datos actualizados
            </span>
          </div>

          <div className="grid grid-cols-2 border-b border-[#24272e] lg:grid-cols-4">
            <ProMetric icon={Briefcase} label="Pasantías activas" value={stats.activas} detail={`${stats.total} publicadas`} />
            <ProMetric icon={CalendarDays} label="Últimos 30 días" value={stats.last30Days} detail="nuevas postulaciones" />
            <ProMetric icon={CheckCircle2} label="Tasa de revisión" value={`${reviewRate}%`} detail={`${reviewed} perfiles revisados`} />
            <ProMetric icon={Target} label="Conversión" value={`${selectedRate}%`} detail={`${funnel.seleccionado} seleccionados`} />
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]">
            <div className="border-b border-[#24272e] p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#f4f6f8]">Embudo de candidatos</h2>
                  <p className="mt-0.5 text-xs text-[#737b88]">{stats.postulaciones} perfiles en total</p>
                </div>
                <Link to="/app/postulaciones-recibidas" className="text-xs font-medium text-[#78b4ff] hover:text-[#a6ceff]">Gestionar</Link>
              </div>
              <div className="space-y-4">
                {funnelRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[105px_1fr_32px] items-center gap-3 sm:grid-cols-[130px_1fr_40px]">
                    <span className="truncate text-xs text-[#aeb5bf]">{row.label}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#24272e]">
                      <span
                        className="block h-full rounded-full bg-[#4b9cff]"
                        style={{ width: `${Math.max(row.value > 0 ? 5 : 0, (row.value / funnelMax) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right text-xs font-semibold text-[#e7e9ed]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#f4f6f8]">Prioridades</h2>
              <div className="mt-3 divide-y divide-[#24272e]">
                <PriorityLink to="/app/postulaciones-recibidas" icon={Clock} value={stats.pendientes} label="sin revisar" />
                <PriorityLink to="/app/postulaciones-recibidas" icon={Send} value={funnel.entrevista} label="en entrevista" />
                <PriorityLink to="/app/mis-pasantias" icon={Briefcase} value={stats.activas} label="búsquedas activas" />
              </div>
            </div>
          </div>

          <div className="grid border-t border-[#24272e] lg:grid-cols-2">
            <div className="border-b border-[#24272e] p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#f4f6f8]">Interés por pasantía</h2>
                <Link to="/app/mis-pasantias" className="text-xs text-[#737b88] hover:text-[#b9c0ca]">Ver publicaciones</Link>
              </div>
              {performance.length > 0 ? (
                <div className="space-y-3.5">
                  {performance.map((item) => (
                    <div key={item.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-[#b9c0ca]">{item.title}</span>
                        <span className="shrink-0 text-xs font-semibold text-[#e7e9ed]">{item.applications}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[#24272e]">
                        <div className="h-full rounded-full bg-[#596273]" style={{ width: `${(item.applications / performanceMax) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-xs text-[#737b88]">Publicá una pasantía para empezar a medir interés.</p>
              )}
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#f4f6f8]">Actividad reciente</h2>
                {recent.length > 0 && <Link to="/app/postulaciones-recibidas" className="text-xs text-[#737b88] hover:text-[#b9c0ca]">Ver todas</Link>}
              </div>
              {recent.length > 0 ? (
                <div className="divide-y divide-[#24272e]">
                  {recent.slice(0, 4).map((application) => (
                    <Link key={application.id} to="/app/postulaciones-recibidas" className="flex items-center gap-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#24272e] text-[10px] font-semibold text-[#d7dbe1]">
                        {(application.student?.full_name || 'E').slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-[#dfe3e8]">{application.student?.full_name || 'Estudiante'}</span>
                        <span className="block truncate text-[11px] text-[#737b88]">{application.internship?.title || 'Pasantía'}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-[#8e96a3]">{STATUS_META[normalizeStatus(application.status)].label}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-xs text-[#737b88]">Las nuevas postulaciones aparecerán acá.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <UpgradePrompt title="Estadísticas de empresa" description="Medí publicaciones, candidatos y pendientes desde un único panel con Empresa Pro." compact />
      )}

      <nav className="mt-4 grid gap-2 sm:grid-cols-3">
        <QuickLink to="/app/mis-pasantias" title="Mis pasantías" desc="Gestionar y editar tus publicaciones" />
        <QuickLink to="/app/postulaciones-recibidas" title="Postulaciones" desc="Ver todos los candidatos recibidos" />
        <QuickLink to="/app/perfil" title="Perfil de empresa" desc="Completar los datos de tu empresa" />
      </nav>
    </div>
  );
}

function ProMetric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string | number; detail: string }) {
  return (
    <div className="border-b border-r border-[#24272e] p-4 last:border-r-0 sm:p-5 lg:border-b-0">
      <div className="flex items-center gap-2 text-[#8e96a3]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#f4f6f8]">{value}</p>
      <p className="mt-1 text-[11px] text-[#646c79]">{detail}</p>
    </div>
  );
}

function PriorityLink({ to, icon: Icon, value, label }: { to: string; icon: LucideIcon; value: number; label: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 py-3">
      <Icon className="h-4 w-4 text-[#687180]" strokeWidth={1.7} />
      <span className="text-lg font-semibold text-[#f4f6f8]">{value}</span>
      <span className="text-xs text-[#8e96a3]">{label}</span>
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#555d69] transition group-hover:translate-x-0.5 group-hover:text-[#8e96a3]" />
    </Link>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white px-3.5 py-3 transition hover:border-white/20 sm:px-4"
    >
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-sm text-white/60">{desc}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  );
}
