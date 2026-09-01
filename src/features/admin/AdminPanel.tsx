// Panel de administración (solo para admins). Muestra:
//   * Usuarios registrados y su rol.
//   * Solicitudes del formulario de acceso anticipado (lo que fueron llenando).
//   * Promotores: crear enlaces y ver el ranking.
// Todo se lee mediante funciones RPC que verifican que seas admin en la base.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  Rocket,
  Copy,
  Check,
  Search,
  RefreshCw,
  Trash2,
  CreditCard,
  Mail,
  Send,
  Loader2,
  X,
  Flag,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendPushEvent } from '../../lib/notify';
import { useAuth } from '../auth/AuthProvider';
import type { Role, SubscriptionPlan } from '../../lib/database.types';
import { planLabel } from '../../lib/plans';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader, PageLoader } from '../ui/primitives';

/* ------------------------------- Tipos ------------------------------- */
interface UserRow {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  plan: SubscriptionPlan;
  plan_expires_at: string | null;
  created_at: string;
}

interface RequestRow {
  id: string;
  rol: string | null;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  universidad: string | null;
  carrera: string | null;
  anio: string | null;
  area: string | null;
  disponibilidad: string | null;
  empresa: string | null;
  rubro: string | null;
  tamano: string | null;
  perfil: string | null;
  org_name: string | null;
  org_type: string | null;
  instagram_link: string | null;
  followers_range: string | null;
  mensaje: string | null;
  origen: string | null;
  referred_by: string | null;
  status: string | null;
  created_at: string;
}

interface PromoterStat {
  code: string;
  nombre: string | null;
  total: number;
  estudiantes: number;
  empresas: number;
  embajadores: number;
  activados: number;
  ultimo_registro: string | null;
}

interface PlanRequestRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: Role;
  current_plan: string;
  requested_plan: 'pro' | 'enterprise' | null;
  kind: 'subscription' | 'featured' | 'promoter';
  internship_id: string | null;
  internship_title: string | null;
  featured_days: number | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  target_type: 'internship' | 'community_post' | 'post' | 'profile';
  target_id: string;
  target_label: string;
  reason: string;
  details: string | null;
  status: 'pendiente' | 'revisado' | 'descartado';
  created_at: string;
}

type Tab = 'usuarios' | 'solicitudes' | 'planes' | 'emails-pro' | 'denuncias' | 'promotores';

const roleLabel: Record<string, string> = {
  estudiante: 'Estudiante',
  empresa: 'Empresa',
  embajador: 'Comunidad',
};

const roleBadge: Record<string, string> = {
  estudiante: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  empresa: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  embajador: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
};

function fmtDate(v: string | null): string {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
}

/* ------------------------------- Panel ------------------------------- */
export default function AdminPanel() {
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('usuarios');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [promoters, setPromoters] = useState<PromoterStat[]>([]);
  const [planRequests, setPlanRequests] = useState<PlanRequestRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsError, setReportsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [u, r, p, plans, reportList] = await Promise.all([
      supabase.rpc('admin_list_users_with_plans'),
      supabase.rpc('admin_list_requests'),
      supabase.rpc('admin_promoter_stats'),
      supabase.rpc('admin_list_plan_requests'),
      supabase.rpc('admin_list_reports'),
    ]);
    if (u.error || r.error || p.error || plans.error) {
      setError('No pudimos cargar los datos. ¿Corriste la migración y te marcaste como admin?');
      setLoading(false);
      return;
    }
    setUsers((u.data ?? []) as UserRow[]);
    setRequests((r.data ?? []) as RequestRow[]);
    setPlanRequests((plans.data ?? []) as PlanRequestRow[]);
    setReports((reportList.data ?? []) as ReportRow[]);
    setReportsError(!!reportList.error);
    setPromoters(
      ((p.data ?? []) as PromoterStat[]).map((row) => ({
        ...row,
        total: Number(row.total),
        estudiantes: Number(row.estudiantes),
        empresas: Number(row.empresas),
        embajadores: Number(row.embajadores),
        activados: Number(row.activados),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.is_admin) load();
  }, [profile?.is_admin, load]);

  // Gate de acceso: solo admins.
  if (authLoading) return <PageLoader />;
  if (!profile?.is_admin) return <Navigate to="/app" replace />;

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'usuarios', label: 'Registrados', icon: Users, count: users.length },
    { key: 'solicitudes', label: 'Formulario', icon: ClipboardList, count: requests.length },
    { key: 'planes', label: 'Planes', icon: CreditCard, count: planRequests.filter((request) => request.status === 'pending').length },
    { key: 'emails-pro', label: 'Emails Pro', icon: Mail, count: users.filter((user) => user.role === 'estudiante' && user.plan === 'free').length },
    { key: 'denuncias', label: 'Denuncias', icon: Flag, count: reports.filter((report) => report.status === 'pendiente').length },
    { key: 'promotores', label: 'Promotores', icon: Rocket, count: promoters.length },
  ];

  return (
    <div>
      <PageHeader
        title="Administración"
        description="Usuarios, solicitudes, denuncias y promotores."
        action={
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
        }
      />

      {/* Pestañas */}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? 'border-brand-400/60 bg-brand-400/15 text-white'
                : 'border-white/12 bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>
          </button>
        ))}
      </div>

      {error && (
        <Card className="mb-5 border-red-400/30 bg-red-500/5 text-sm text-red-200">{error}</Card>
      )}

      {loading ? (
        <PageLoader />
      ) : tab === 'usuarios' ? (
        <UsersTab users={users} onChanged={load} />
      ) : tab === 'solicitudes' ? (
        <RequestsTab requests={requests} users={users} onChanged={load} />
      ) : tab === 'planes' ? (
        <PlanRequestsTab requests={planRequests} onChanged={load} />
      ) : tab === 'emails-pro' ? (
        <StudentPlanEmailsTab users={users} />
      ) : tab === 'denuncias' ? (
        <ReportsTab reports={reports} setupError={reportsError} onChanged={load} />
      ) : (
        <PromotersTab promoters={promoters} onChanged={load} />
      )}
    </div>
  );
}

function StudentPlanEmailsTab({ users }: { users: UserRow[] }) {
  const students = users.filter((user) => user.role === 'estudiante' && user.plan === 'free' && user.email);
  const [q, setQ] = useState('');
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [batchSending, setBatchSending] = useState(false);

  const filtered = students.filter((student) => {
    const search = q.trim().toLowerCase();
    return !search || `${student.full_name} ${student.email}`.toLowerCase().includes(search);
  });

  async function sendTo(student: UserRow): Promise<boolean> {
    setSendingIds((current) => new Set(current).add(student.id));
    try {
      const { error } = await supabase.functions.invoke('send-student-plan-email', {
        body: { user_id: student.id },
      });
      if (error) {
        alert(`No se pudo enviar el email a ${student.email}: ${error.message}`);
        return false;
      }
      setSentIds((current) => new Set(current).add(student.id));
      return true;
    } catch {
      alert(`No se pudo conectar para enviar el email a ${student.email}.`);
      return false;
    } finally {
      setSendingIds((current) => {
        const next = new Set(current);
        next.delete(student.id);
        return next;
      });
    }
  }

  async function sendBatch() {
    const pending = filtered.filter((student) => !sentIds.has(student.id));
    if (pending.length === 0) return;
    if (!window.confirm(`¿Enviar el email personalizado de Estudiante Pro a ${pending.length} estudiante${pending.length === 1 ? '' : 's'}?`)) return;
    setBatchSending(true);
    for (const [index, student] of pending.entries()) {
      const sent = await sendTo(student);
      if (!sent) break;
      if (index < pending.length - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
      }
    }
    setBatchSending(false);
  }

  return (
    <div>
      <Card className="mb-4 border-brand-500/20 bg-brand-500/5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-white">Campaña Estudiante Pro</p>
            <p className="mt-1 max-w-2xl text-sm text-white/60">
              Email personalizado con las funciones desbloqueadas, imagen de PasantIA y precio promocional de $5.000 por mes.
            </p>
          </div>
          <Button size="sm" disabled={batchSending || filtered.length === 0} onClick={() => void sendBatch()}>
            {batchSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {batchSending ? 'Enviando…' : 'Enviar pendientes'}
          </Button>
        </div>
      </Card>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar estudiante por nombre o email…"
          className="w-full rounded-full border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-400/60"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((student) => {
          const sending = sendingIds.has(student.id);
          const sent = sentIds.has(student.id);
          return (
            <Card key={student.id} className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{student.full_name || 'Estudiante'}</p>
                <p className="truncate text-sm text-white/55">{student.email}</p>
              </div>
              <Button
                variant={sent ? 'ghost' : 'secondary'}
                size="sm"
                disabled={sending || sent || batchSending}
                onClick={() => void sendTo(student)}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {sending ? 'Enviando…' : sent ? 'Enviado' : 'Enviar email'}
              </Button>
            </Card>
          );
        })}
        {filtered.length === 0 && <Card className="text-center text-sm text-white/45">No hay estudiantes Gratis para contactar.</Card>}
      </div>
    </div>
  );
}

const reportTargetLabel: Record<ReportRow['target_type'], string> = {
  internship: 'Pasantía',
  community_post: 'Anuncio de comunidad',
  post: 'Publicación',
  profile: 'Perfil',
};

const reportReasonLabel: Record<string, string> = {
  falsa: 'Pasantía falsa o engañosa',
  estafa: 'Posible estafa',
  no_es_pasantia: 'No es una pasantía',
  discriminatorio: 'Contenido discriminatorio',
  spam: 'Spam o publicidad',
  acoso: 'Acoso o discurso de odio',
  ilegal: 'Contenido ilegal',
  copyright: 'Infracción de derechos de autor',
  suplantacion: 'Suplantación de identidad',
  falso: 'Perfil falso',
  otro: 'Otro motivo',
};

function ReportsTab({
  reports,
  setupError,
  onChanged,
}: {
  reports: ReportRow[];
  setupError: boolean;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<'todos' | ReportRow['status']>('pendiente');
  const [resolving, setResolving] = useState<string | null>(null);

  async function setStatus(id: string, status: ReportRow['status']) {
    setResolving(id);
    const { error } = await supabase.rpc('admin_set_report_status', { p_id: id, p_status: status });
    setResolving(null);
    if (error) {
      alert(`No se pudo actualizar la denuncia: ${error.message}`);
      return;
    }
    onChanged();
  }

  if (setupError) {
    return (
      <Card className="border-red-400/30 bg-red-500/5 text-sm text-red-700">
        Falta actualizar la migración de denuncias. Ejecutá supabase/migracion-reportes.sql en el SQL Editor.
      </Card>
    );
  }

  const filtered = filter === 'todos' ? reports : reports.filter((report) => report.status === filter);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as 'todos' | ReportRow['status'])}
          className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-brand-400/60"
          aria-label="Filtrar denuncias por estado"
        >
          <option value="pendiente">Pendientes</option>
          <option value="revisado">Revisadas</option>
          <option value="descartado">Descartadas</option>
          <option value="todos">Todas</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((report) => (
          <Card key={report.id}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700">
                    {reportTargetLabel[report.target_type]}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                    {report.status === 'pendiente' ? 'Pendiente' : report.status === 'revisado' ? 'Revisada' : 'Descartada'}
                  </span>
                  <span className="text-xs text-white/45">{fmtDate(report.created_at)}</span>
                </div>
                <p className="mt-3 font-semibold text-white">{report.target_label}</p>
                <p className="mt-1 text-sm text-white/75">
                  Motivo: {reportReasonLabel[report.reason] ?? report.reason}
                </p>
                {report.details && (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70">
                    {report.details}
                  </p>
                )}
                <p className="mt-3 text-xs text-white/45">
                  Denunció {report.reporter_name}{report.reporter_email ? ` · ${report.reporter_email}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {report.status !== 'descartado' && (
                  <Button variant="ghost" size="sm" disabled={resolving === report.id} onClick={() => void setStatus(report.id, 'descartado')}>
                    Descartar
                  </Button>
                )}
                {report.status !== 'revisado' && (
                  <Button variant="primary" size="sm" disabled={resolving === report.id} onClick={() => void setStatus(report.id, 'revisado')}>
                    <Check className="h-4 w-4" /> Marcar revisada
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="text-center text-sm text-white/45">No hay denuncias en este estado.</Card>
        )}
      </div>
    </div>
  );
}

function PlanRequestsTab({ requests, onChanged }: { requests: PlanRequestRow[]; onChanged: () => void }) {
  const [resolving, setResolving] = useState<string | null>(null);

  async function resolve(request: PlanRequestRow, approve: boolean) {
    const action = approve ? 'aprobar' : 'rechazar';
    if (!window.confirm(`¿${action[0].toUpperCase() + action.slice(1)} la solicitud de ${request.full_name}?`)) return;
    setResolving(request.id);
    const { error } = await supabase.rpc('admin_resolve_plan_request', {
      p_request_id: request.id,
      p_approve: approve,
      p_note: null,
    });
    setResolving(null);
    if (error) {
      alert(`No se pudo ${action}: ${error.message}`);
      return;
    }
    void sendPushEvent('plan_resolved', request.id);
    onChanged();
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{request.full_name || request.email}</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${roleBadge[request.role] ?? ''}`}>
                  {roleLabel[request.role] ?? request.role}
                </span>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/55">
                  {request.status === 'pending' ? 'Pendiente' : request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/55">{request.email}</p>
              <p className="mt-3 text-sm text-white">
                {request.kind === 'subscription'
                  ? `Plan ${request.role === 'embajador' ? 'Embajador Premium' : request.requested_plan === 'enterprise' ? 'Empresa' : 'Pro'} · actual: ${request.current_plan}`
                  : request.kind === 'featured'
                    ? `Destacar “${request.internship_title || 'Pasantía'}” por ${request.featured_days} días`
                    : 'Solicitud para ser promotor/a'}
              </p>
              {request.message && <p className="mt-1 text-xs text-white/45">{request.message}</p>}
              <p className="mt-2 text-xs text-white/40">{fmtDate(request.created_at)}</p>
            </div>
            {request.status === 'pending' && (
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="sm" disabled={resolving === request.id} onClick={() => void resolve(request, false)}>
                  <X className="h-4 w-4" /> Rechazar
                </Button>
                <Button variant="primary" size="sm" disabled={resolving === request.id} onClick={() => void resolve(request, true)}>
                  <Check className="h-4 w-4" /> Aprobar
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
      {requests.length === 0 && <Card className="text-center text-sm text-white/45">Sin solicitudes de planes.</Card>}
    </div>
  );
}

/* ----------------------------- Registrados ----------------------------- */
function UsersTab({ users, onChanged }: { users: UserRow[]; onChanged: () => void }) {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | Role>('todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);

  async function handlePlanChange(user: UserRow, plan: SubscriptionPlan) {
    if (plan === user.plan || changingPlanId) return;
    if (plan === 'free' && !window.confirm(`¿Bajar a ${user.full_name || user.email} al plan Gratis? Los beneficios del plan actual se desactivarán al instante.`)) return;
    setChangingPlanId(user.id);
    const { data, error } = await supabase.rpc('admin_set_user_plan', {
      p_user_id: user.id,
      p_plan: plan,
    });
    setChangingPlanId(null);
    if (error) {
      alert(`No se pudo cambiar el plan: ${error.message}`);
      return;
    }
    if (data) void sendPushEvent('plan_resolved', String(data));
    onChanged();
  }

  async function handleDelete(u: UserRow) {
    const ok = window.confirm(
      `¿Borrar definitivamente la cuenta de "${u.full_name || u.email}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setDeletingId(u.id);
    const { error } = await supabase.rpc('admin_delete_user', { p_id: u.id });
    setDeletingId(null);
    if (error) {
      alert(`No se pudo borrar: ${error.message}`);
      return;
    }
    onChanged();
  }

  const counts = useMemo(() => {
    const c = { estudiante: 0, empresa: 0, embajador: 0 } as Record<string, number>;
    users.forEach((u) => (c[u.role] = (c[u.role] ?? 0) + 1));
    return c;
  }, [users]);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'todos' && u.role !== roleFilter) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (u.full_name + ' ' + u.email).toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {(['estudiante', 'empresa', 'embajador'] as Role[]).map((r) => (
          <Card key={r} className="text-center">
            <p className="text-2xl font-bold text-white">{counts[r] ?? 0}</p>
            <p className="mt-0.5 text-xs text-white/55">{roleLabel[r]}s</p>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full rounded-full border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-400/60"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'todos' | Role)}
          className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-brand-400/60"
        >
          <option value="todos">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="empresa">Empresas</option>
          <option value="embajador">Comunidades</option>
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-white">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-white/70">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${roleBadge[u.role] ?? ''}`}>
                    {roleLabel[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan}
                    onChange={(event) => void handlePlanChange(u, event.target.value as SubscriptionPlan)}
                    disabled={changingPlanId === u.id}
                    className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-brand-400/60 disabled:opacity-50"
                    aria-label={`Plan de ${u.full_name || u.email}`}
                    title={u.plan_expires_at ? `Vence ${fmtDate(u.plan_expires_at)}` : 'Sin vencimiento'}
                  >
                    <option value="free">Gratis / Básico</option>
                    <option value="pro">{planLabel('pro', u.role)}</option>
                    {u.role === 'empresa' && <option value="enterprise">Empresa</option>}
                  </select>
                </td>
                <td className="px-4 py-3 text-white/50">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={deletingId === u.id}
                    title="Borrar cuenta"
                    className="rounded-lg p-1.5 text-red-300/70 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ----------------------------- Formulario ----------------------------- */
function RequestsTab({
  requests,
  users,
  onChanged,
}: {
  requests: RequestRow[];
  users: UserRow[];
  onChanged: () => void;
}) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'activado'>('todos');
  const [regFilter, setRegFilter] = useState<'todos' | 'si' | 'no'>('todos');

  // Emails que YA tienen cuenta (perfil registrado).
  const registered = useMemo(
    () => new Set(users.map((u) => (u.email || '').trim().toLowerCase())),
    [users]
  );
  const isRegistered = (email: string | null) =>
    !!email && registered.has(email.trim().toLowerCase());

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.rpc('admin_set_request_status', { p_id: id, p_status: status });
    if (!error) onChanged();
  }

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'todos' && (r.status ?? 'pendiente') !== statusFilter) return false;
    if (regFilter === 'si' && !isRegistered(r.email)) return false;
    if (regFilter === 'no' && isRegistered(r.email)) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [r.nombre, r.email, r.universidad, r.empresa, r.org_name, r.referred_by]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(s);
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre, email, universidad, promotor…"
            className="w-full rounded-full border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-400/60"
          />
        </div>
        <select
          value={regFilter}
          onChange={(e) => setRegFilter(e.target.value as 'todos' | 'si' | 'no')}
          className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-brand-400/60"
        >
          <option value="todos">Todos</option>
          <option value="si">Registrados</option>
          <option value="no">Sin cuenta</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'pendiente' | 'activado')}
          className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-brand-400/60"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="activado">Activados</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{r.nombre || 'Sin nombre'}</p>
                  {r.rol && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${roleBadge[r.rol] ?? ''}`}>
                      {roleLabel[r.rol] ?? r.rol}
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      (r.status ?? 'pendiente') === 'activado'
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/15 bg-white/5 text-white/60'
                    }`}
                  >
                    {(r.status ?? 'pendiente') === 'activado' ? 'Activado' : 'Pendiente'}
                  </span>
                  {isRegistered(r.email) ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-200">
                      Registrado
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/50">
                      Sin cuenta
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-white/70">{r.email || '—'}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                  {r.telefono && <span>Tel: {r.telefono}</span>}
                  {r.universidad && <span>Universidad: {r.universidad}</span>}
                  {r.carrera && <span>Carrera: {r.carrera}</span>}
                  {r.anio && <span>Año: {r.anio}</span>}
                  {r.area && <span>Área: {r.area}</span>}
                  {r.disponibilidad && <span>Disponibilidad: {r.disponibilidad}</span>}
                  {r.empresa && <span>Empresa: {r.empresa}</span>}
                  {r.rubro && <span>Rubro: {r.rubro}</span>}
                  {r.tamano && <span>Tamaño: {r.tamano}</span>}
                  {r.org_name && <span>Comunidad: {r.org_name}</span>}
                  {r.org_type && <span>Tipo: {r.org_type}</span>}
                  {r.instagram_link && <span>IG: {r.instagram_link}</span>}
                  {r.followers_range && <span>Seguidores: {r.followers_range}</span>}
                  {r.origen && <span>Origen: {r.origen}</span>}
                  {r.referred_by && <span className="text-brand-300">Promotor: {r.referred_by}</span>}
                  <span>{fmtDate(r.created_at)}</span>
                </div>
                {r.perfil && <p className="mt-2 text-sm text-white/60">{r.perfil}</p>}
                {r.mensaje && <p className="mt-2 text-sm text-white/60">“{r.mensaje}”</p>}
              </div>
              <div className="shrink-0">
                {(r.status ?? 'pendiente') === 'activado' ? (
                  <Button variant="ghost" size="sm" onClick={() => setStatus(r.id, 'pendiente')}>
                    Marcar pendiente
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setStatus(r.id, 'activado')}>
                    <Check className="h-4 w-4" /> Marcar activado
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="text-center text-sm text-white/45">Sin solicitudes.</Card>
        )}
      </div>
    </div>
  );
}

function PromotersTab({
  promoters,
  onChanged,
}: {
  promoters: PromoterStat[];
  onChanged: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkFor = (c: string) => `${origin}/?ref=${c}`;

  async function copy(c: string) {
    try {
      await navigator.clipboard.writeText(linkFor(c));
      setCopied(c);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  async function remove(c: string) {
    const { error } = await supabase.rpc('admin_remove_promoter', { p_code: c });
    if (!error) onChanged();
  }

  return (
    <div>
      <p className="mb-4 text-sm text-white/55">
        Las altas nuevas se aprueban desde la pestaña Planes. Los promotores existentes se mantienen activos.
      </p>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Promotor</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estud.</th>
              <th className="px-4 py-3 font-medium">Emp.</th>
              <th className="px-4 py-3 font-medium">Activ.</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promoters.map((p) => (
              <tr key={p.code} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <span className="text-white">{p.nombre || p.code}</span>
                  <span className="ml-2 text-xs text-white/40">?ref={p.code}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-white">{p.total}</td>
                <td className="px-4 py-3 text-white/70">{p.estudiantes}</td>
                <td className="px-4 py-3 text-white/70">{p.empresas}</td>
                <td className="px-4 py-3 text-white/70">{p.activados}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copy(p.code)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:text-white"
                    >
                      {copied === p.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === p.code ? 'Copiado' : 'Copiar'}
                    </button>
                    <button
                      onClick={() => remove(p.code)}
                      className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                    >
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {promoters.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                  Todavía no hay promotores asignados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
