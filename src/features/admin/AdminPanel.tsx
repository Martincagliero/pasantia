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
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Role } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader, PageLoader } from '../ui/primitives';

/* ------------------------------- Tipos ------------------------------- */
interface UserRow {
  id: string;
  role: Role;
  full_name: string;
  email: string;
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
  empresa: string | null;
  org_name: string | null;
  instagram_link: string | null;
  mensaje: string | null;
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

type Tab = 'usuarios' | 'solicitudes' | 'promotores';

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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [u, r, p] = await Promise.all([
      supabase.rpc('admin_list_users'),
      supabase.rpc('admin_list_requests'),
      supabase.rpc('admin_promoter_stats'),
    ]);
    if (u.error || r.error || p.error) {
      setError('No pudimos cargar los datos. ¿Corriste la migración y te marcaste como admin?');
      setLoading(false);
      return;
    }
    setUsers((u.data ?? []) as UserRow[]);
    setRequests((r.data ?? []) as RequestRow[]);
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
    { key: 'promotores', label: 'Promotores', icon: Rocket, count: promoters.length },
  ];

  return (
    <div>
      <PageHeader
        title="Administración"
        description="Usuarios, solicitudes del formulario y promotores."
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
        <UsersTab users={users} />
      ) : tab === 'solicitudes' ? (
        <RequestsTab requests={requests} onChanged={load} />
      ) : (
        <PromotersTab promoters={promoters} onChanged={load} />
      )}
    </div>
  );
}

/* ----------------------------- Registrados ----------------------------- */
function UsersTab({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | Role>('todos');

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
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Alta</th>
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
                <td className="px-4 py-3 text-white/50">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/45">
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
function RequestsTab({ requests, onChanged }: { requests: RequestRow[]; onChanged: () => void }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'activado'>('todos');

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.rpc('admin_set_request_status', { p_id: id, p_status: status });
    if (!error) onChanged();
  }

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'todos' && (r.status ?? 'pendiente') !== statusFilter) return false;
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
                </div>
                <p className="mt-1 text-sm text-white/70">{r.email || '—'}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                  {r.telefono && <span>Tel: {r.telefono}</span>}
                  {r.universidad && <span>Universidad: {r.universidad}</span>}
                  {r.carrera && <span>Carrera: {r.carrera}</span>}
                  {r.empresa && <span>Empresa: {r.empresa}</span>}
                  {r.org_name && <span>Comunidad: {r.org_name}</span>}
                  {r.instagram_link && <span>IG: {r.instagram_link}</span>}
                  {r.referred_by && <span className="text-brand-300">Promotor: {r.referred_by}</span>}
                  <span>{fmtDate(r.created_at)}</span>
                </div>
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

/* ----------------------------- Promotores ----------------------------- */
function PromotersTab({ promoters, onChanged }: { promoters: PromoterStat[]; onChanged: () => void }) {
  const [code, setCode] = useState('');
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
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

  async function createPromoter() {
    const clean = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean) return;
    setSaving(true);
    const { error } = await supabase.rpc('admin_upsert_promoter', {
      p_code: clean,
      p_nombre: nombre.trim() || null,
    });
    setSaving(false);
    if (!error) {
      setCode('');
      setNombre('');
      onChanged();
    }
  }

  return (
    <div>
      {/* Crear enlace */}
      <Card className="mb-5">
        <p className="text-sm font-semibold text-white">Generar enlace de promotor</p>
        <p className="mt-1 text-xs text-white/55">
          Elegí un código corto (ej. el nombre). El enlace queda: {origin}/?ref=codigo
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre (opcional)"
            className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-400/60"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="codigo"
            className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-400/60"
          />
          <Button variant="primary" size="sm" onClick={createPromoter} disabled={saving || !code.trim()}>
            {saving ? 'Guardando…' : 'Crear'}
          </Button>
        </div>
      </Card>

      {/* Ranking */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Promotor</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estud.</th>
              <th className="px-4 py-3 font-medium">Emp.</th>
              <th className="px-4 py-3 font-medium">Activ.</th>
              <th className="px-4 py-3 font-medium">Enlace</th>
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
                  <button
                    onClick={() => copy(p.code)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:text-white"
                  >
                    {copied === p.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === p.code ? 'Copiado' : 'Copiar'}
                  </button>
                </td>
              </tr>
            ))}
            {promoters.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                  Todavía no hay promotores con registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
