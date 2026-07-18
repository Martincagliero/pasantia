// Empresa: panel de resumen con métricas y últimas postulaciones.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Send, Clock, ArrowRight, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { ApplicationStatus } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageLoader, StatusBadge } from '../ui/primitives';

interface RecentApp {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  internship: { title: string } | null;
  student: { full_name: string } | null;
}

export default function CompanyOverview() {
  const { session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, activas: 0, postulaciones: 0, pendientes: 0 });
  const [recent, setRecent] = useState<RecentApp[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = session!.user.id;
      const [{ data: internships }, { data: apps }] = await Promise.all([
        supabase.from('internships').select('id, is_active').eq('company_id', uid),
        supabase
          .from('applications')
          .select('id, status, created_at, internship:internships(title, company_id), student:profiles(full_name)')
          .order('created_at', { ascending: false }),
      ]);
      if (!active) return;

      const list = internships ?? [];
      // applications ya viene filtrado por RLS a las pasantías de esta empresa.
      const applications = (apps ?? []) as unknown as RecentApp[];

      setStats({
        total: list.length,
        activas: list.filter((i: { is_active: boolean }) => i.is_active).length,
        postulaciones: applications.length,
        pendientes: applications.filter((a) => a.status === 'pendiente').length,
      });
      setRecent(applications.slice(0, 6));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  if (loading) return <PageLoader />;

  const firstName = (profile?.full_name || 'tu empresa').split(' ')[0];

  const cards: { label: string; value: number; icon: LucideIcon; accent: string; to: string }[] = [
    { label: 'Pasantías activas', value: stats.activas, icon: CheckCircle2, accent: 'text-emerald-300', to: '/app/mis-pasantias' },
    { label: 'Pasantías totales', value: stats.total, icon: Briefcase, accent: 'text-white', to: '/app/mis-pasantias' },
    { label: 'Postulaciones', value: stats.postulaciones, icon: Send, accent: 'text-sky-300', to: '/app/postulaciones-recibidas' },
    { label: 'Nuevos sin revisar', value: stats.pendientes, icon: Clock, accent: 'text-amber-300', to: '/app/postulaciones-recibidas' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div>
      {/* Header con saludo */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/60">{greeting} 👋</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{firstName}</h1>
          <p className="mt-1 text-[15px] text-white/60">
            {stats.pendientes > 0
              ? `Tenés ${stats.pendientes} postulación${stats.pendientes === 1 ? '' : 'es'} sin revisar.`
              : 'No tenés postulaciones pendientes. ¡Todo al día!'}
          </p>
        </div>
        <Button as="link" to="/app/publicar" variant="primary" size="md">
          <Plus className="h-5 w-5" /> Publicar pasantía
        </Button>
      </div>

      {/* Métricas (clickeables) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, accent, to }) => (
          <Link
            key={label}
            to={to}
            className="glass group rounded-3xl border border-white/12 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl hover:shadow-brand-950/30 sm:p-5"
          >
            <Icon className={`h-6 w-6 ${accent}`} strokeWidth={1.75} />
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60 sm:text-sm">
              {label}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        <QuickLink to="/app/mis-pasantias" title="Mis pasantías" desc="Gestionar y editar tus publicaciones" />
        <QuickLink to="/app/postulaciones-recibidas" title="Postulaciones" desc="Ver todos los candidatos recibidos" />
        <QuickLink to="/app/perfil" title="Perfil de empresa" desc="Completar los datos de tu empresa" />
      </div>

      {/* Últimas postulaciones */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Últimas postulaciones</h2>
          {recent.length > 0 && (
            <Link
              to="/app/postulaciones-recibidas"
              className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="Todavía no recibiste postulaciones"
            description="Publicá una pasantía para empezar a recibir candidatos."
            action={
              <Button as="link" to="/app/publicar" variant="secondary" size="sm">
                Publicar pasantía
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recent.map((a) => (
              <Card key={a.id} className="!p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {a.student?.full_name || 'Estudiante'}
                  </p>
                  <p className="truncate text-sm text-white/60">
                    {a.internship?.title || 'Pasantía'}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="glass group flex items-center justify-between gap-3 rounded-3xl border border-white/12 p-4 transition hover:border-white/25 hover:bg-white/[0.08] sm:p-5"
    >
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-sm text-white/60">{desc}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  );
}
