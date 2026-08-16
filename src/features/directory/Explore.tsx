// Sección "Explorar perfiles": cualquier rol puede buscar y ver perfiles
// de estudiantes (públicos), empresas y embajadores (verificados).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  X,
  Mail,
  GraduationCap,
  MapPin,
  Building2,
  Megaphone,
  Users,
  Globe,
  Link2,
  Briefcase,
  MessageSquare,
  Phone,
  UserPlus,
  UserCheck,
  Network,
  ChevronDown,
  Clock3,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type {
  StudentProfile,
  CompanyProfile,
  AmbassadorProfile,
  ConnectionRequest,
  Post,
} from '../../lib/database.types';
import { sendPush } from '../../lib/notify';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { TextField } from '../ui/Field';
import { useModalGuard } from '../ui/modalGuard';
import { VerifiedBadge } from '../ambassador/VerifiedBadge';
import { orgTypeLabel } from '../ambassador/ambassadorConfig';
import { useMessages } from '../messages/MessagesProvider';
import { useAuth } from '../auth/AuthProvider';
import { UserPosts } from '../posts/UserPosts';
import { LinkPreview } from '../ui/LinkPreview';
import { PostInteractions } from '../ui/PostInteractions';
import { EmojiText } from '../ui/EmojiText';
import { ReportButton } from '../ui/ReportButton';

type Tab = 'estudiantes' | 'empresas' | 'embajadores' | 'red';

interface StudentRow extends StudentProfile {
  profile: { full_name: string; email: string } | null;
}
interface CompanyRow extends CompanyProfile {
  profile: { full_name: string; email: string } | null;
}
type AmbRow = AmbassadorProfile;

type Selected =
  | { type: 'estudiantes'; row: StudentRow }
  | { type: 'empresas'; row: CompanyRow }
  | { type: 'embajadores'; row: AmbRow };

type ConnectionState = 'none' | 'sent' | 'received' | 'connected';

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Solo permite http/https para links externos. */
function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/** Normaliza un Instagram: acepta "@usuario", "usuario" o una URL completa. */
function instaHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/^instagram\.com\//i, '');
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

function Avatar({
  url,
  name,
  className = 'h-12 w-12',
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
}) {
  return url ? (
    <img
      src={url}
      alt={name}
      loading="lazy"
      decoding="async"
      className={`${className} shrink-0 rounded-full border border-white/12 object-cover`}
    />
  ) : (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-sm font-bold text-white`}
    >
      {initials(name)}
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'estudiantes', label: 'Estudiantes', icon: GraduationCap },
  { key: 'empresas', label: 'Empresas', icon: Building2 },
  { key: 'embajadores', label: 'Embajadores', icon: Megaphone },
  { key: 'red', label: 'Red', icon: Network },
];

export default function Explore() {
  const [params] = useSearchParams();
  const paramQuery = params.get('q') ?? '';
  const { openChatWith } = useMessages();
  const { profile: viewer } = useAuth();
  const viewerRole = viewer?.role;
  const uid = viewer?.id ?? null;
  const [tab, setTab] = useState<Tab>(() => (params.get('tab') === 'red' ? 'red' : 'estudiantes'));
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbRow[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);

  // La barra superior puede buscar varias veces sin desmontar esta página.
  useEffect(() => {
    setQuery(paramQuery);
  }, [paramQuery]);

  useEffect(() => {
    if (params.get('tab') === 'red') setTab('red');
  }, [params]);

  const loadNetwork = useCallback(async () => {
    if (!uid) return;
    const [followsResult, requestsResult] = await Promise.all([
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid),
      supabase
        .from('connection_requests')
        .select('*')
        .or(`requester_id.eq.${uid},recipient_id.eq.${uid}`)
        .in('status', ['pending', 'accepted']),
    ]);
    setFollowingIds(
      new Set(
        (followsResult.data ?? []).map((f) => (f as { following_id: string }).following_id)
      )
    );
    setConnectionRequests((requestsResult.data as ConnectionRequest[] | null) ?? []);
  }, [uid]);

  useEffect(() => {
    void loadNetwork();
  }, [loadNetwork]);

  // Seguir / dejar de seguir (optimista).
  async function toggleFollow(targetId: string) {
    if (!uid || targetId === uid) return;
    const isFollowing = followingIds.has(targetId);
    setFollowingIds((prev) => {
      const n = new Set(prev);
      if (isFollowing) n.delete(targetId);
      else n.add(targetId);
      return n;
    });
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', targetId);
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: uid, following_id: targetId });
      if (error) {
        // revertir
        setFollowingIds((prev) => {
          const n = new Set(prev);
          n.delete(targetId);
          return n;
        });
        if (/does not exist|schema cache|relation/i.test(error.message)) {
          alert('Falta correr la migración "migracion-red-seguir.sql" en Supabase para activar la Red.');
        }
      }
    }
  }

  function connectionStateFor(targetId: string): ConnectionState {
    if (followingIds.has(targetId)) return 'connected';
    const request = connectionRequests.find(
      (row) =>
        row.status === 'pending' &&
        ((row.requester_id === uid && row.recipient_id === targetId) ||
          (row.recipient_id === uid && row.requester_id === targetId))
    );
    if (!request) return 'none';
    return request.requester_id === uid ? 'sent' : 'received';
  }

  async function respondConnection(request: ConnectionRequest, accept: boolean) {
    const { error } = await supabase.rpc('respond_connection_request', {
      p_request_id: request.id,
      p_accept: accept,
    });
    if (error) {
      alert(
        /does not exist|schema cache|function/i.test(error.message)
          ? 'Falta correr la migración "migracion-solicitudes-conexion.sql" en Supabase.'
          : 'No se pudo responder la solicitud.'
      );
      return;
    }
    setConnectionRequests((current) => current.filter((row) => row.id !== request.id));
    if (accept) {
      setFollowingIds((current) => new Set(current).add(request.requester_id));
      sendPush({
        userId: request.requester_id,
        title: 'Conexión aceptada',
        body: `${viewer?.full_name || 'Un estudiante'} aceptó tu solicitud de conexión.`,
        url: '/app/explorar?tab=red',
      });
    }
  }

  async function toggleConnection(targetId: string) {
    if (!uid || targetId === uid) return;
    const state = connectionStateFor(targetId);
    const existing = connectionRequests.find(
      (row) =>
        row.status === 'pending' &&
        ((row.requester_id === uid && row.recipient_id === targetId) ||
          (row.recipient_id === uid && row.requester_id === targetId))
    );
    if (state === 'connected') return;
    if (state === 'received' && existing) {
      await respondConnection(existing, true);
      return;
    }
    if (state === 'sent' && existing) {
      const { error } = await supabase.from('connection_requests').delete().eq('id', existing.id);
      if (!error) setConnectionRequests((current) => current.filter((row) => row.id !== existing.id));
      return;
    }

    const { data, error } = await supabase.rpc('request_connection', { p_recipient_id: targetId });
    if (error) {
      alert(
        /does not exist|schema cache|function/i.test(error.message)
          ? 'Falta correr la migración "migracion-solicitudes-conexion.sql" en Supabase.'
          : 'No se pudo enviar la solicitud.'
      );
      return;
    }
    setConnectionRequests((current) => [
      ...current,
      {
        id: String(data),
        requester_id: uid,
        recipient_id: targetId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    sendPush({
      userId: targetId,
      title: 'Nueva solicitud de conexión',
      body: `${viewer?.full_name || 'Un estudiante'} quiere conectar con vos.`,
      url: '/app/explorar?tab=red',
    });
  }


  useEffect(() => {
    let active = true;
    // Privacidad: qué datos del estudiante se traen según el rol de quien mira.
    //  - Empresa: todo (incluye CV/analítico/promedio).
    //  - Embajador y estudiante: perfil público completo (estudios, contacto,
    //    redes, descripción y actividad) PERO sin CV/analítico/promedio.
    const publicStudentCols =
      'id, avatar_url, verified, university, career, year, area, location, phone, instagram_url, linkedin_url, github_url, portfolio_url, bio, skills, profile:profiles(full_name, email)';
    const studentSelect =
      viewerRole === 'empresa' ? '*, profile:profiles(full_name, email)' : publicStudentCols;
    (async () => {
      const [{ data: st }, { data: co }, { data: am }] = await Promise.all([
        supabase.from('student_profiles').select(studentSelect).eq('is_public', true),
        supabase.from('company_profiles').select('*, profile:profiles(full_name, email)'),
        // Mostramos todas las comunidades (incluye las del acceso anticipado, aún
        // sin verificar). El tilde de verificado se muestra solo si corresponde.
        supabase.from('ambassador_profiles').select('*'),
      ]);
      if (!active) return;
      setStudents((st as unknown as StudentRow[]) ?? []);
      setCompanies((co as unknown as CompanyRow[]) ?? []);
      setAmbassadors((am as AmbRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [viewerRole]);

  // Si llegamos con ?u=<id> (ej. desde el chat), abrimos ese perfil.
  useEffect(() => {
    if (loading) return;
    const u = params.get('u');
    if (!u) return;
    const st = students.find((r) => r.id === u);
    if (st) {
      setTab('estudiantes');
      setSelected({ type: 'estudiantes', row: st });
      return;
    }
    const co = companies.find((r) => r.id === u);
    if (co) {
      setTab('empresas');
      setSelected({ type: 'empresas', row: co });
      return;
    }
    const am = ambassadors.find((r) => r.id === u);
    if (am) {
      setTab('embajadores');
      setSelected({ type: 'embajadores', row: am });
    }
  }, [loading, params, students, companies, ambassadors]);

  const q = query.trim().toLowerCase();

  const filteredStudents = useMemo(
    () =>
      students
        .filter((r) => {
          if (!q) return true;
          return [r.profile?.full_name, r.career, r.university, r.area, (r.skills ?? []).join(' ')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q);
        })
        .sort((a, b) => (b.avatar_url ? 1 : 0) - (a.avatar_url ? 1 : 0)),
    [students, q]
  );

  const filteredCompanies = useMemo(
    () =>
      companies
        .filter((r) => {
          if (!q) return true;
          return [r.company_name, r.industry, r.profile?.full_name, r.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q);
        })
        .sort((a, b) => (b.avatar_url ? 1 : 0) - (a.avatar_url ? 1 : 0)),
    [companies, q]
  );

  const filteredAmbassadors = useMemo(
    () =>
      ambassadors
        .filter((r) => {
          if (!q) return true;
          return [r.org_name, r.university, orgTypeLabel(r.org_type), r.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q);
        })
        .sort((a, b) => (b.logo_url ? 1 : 0) - (a.logo_url ? 1 : 0)),
    [ambassadors, q]
  );

  // Las búsquedas globales abren la primera categoría que tenga resultados.
  useEffect(() => {
    if (loading || !paramQuery.trim()) return;
    if (filteredStudents.length > 0) setTab('estudiantes');
    else if (filteredCompanies.length > 0) setTab('empresas');
    else if (filteredAmbassadors.length > 0) setTab('embajadores');
  }, [loading, paramQuery, filteredStudents.length, filteredCompanies.length, filteredAmbassadors.length]);

  if (loading) return <PageLoader />;

  function handleMessage(id: string, name: string, avatar?: string | null) {
    openChatWith(id, name, avatar ?? null);
    setSelected(null);
  }

  const count =
    tab === 'estudiantes'
      ? filteredStudents.length
      : tab === 'empresas'
        ? filteredCompanies.length
        : filteredAmbassadors.length;

  return (
    <div>
      <PageHeader
        title={viewerRole === 'empresa' ? 'Explorar talentos' : 'Explorar perfiles'}
        description={
          viewerRole === 'empresa'
            ? 'Encontrá estudiantes y conocé los perfiles de la comunidad.'
            : 'Buscá y conocé a estudiantes, empresas y embajadores de la comunidad.'
        }
      />

      {/* Tabs: categorías (segmentado) + "Red" como acceso aparte, minimalista */}
      <div className="mb-4 flex items-center gap-2 sm:mb-5">
        <div className="flex min-w-0 flex-1 gap-1.5 sm:flex-none sm:gap-2">
          {TABS.filter((t) => t.key !== 'red').map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-[12.5px] font-medium transition sm:flex-none sm:px-4 sm:py-2 sm:text-sm ${
                tab === key
                  ? 'border-brand-400/50 bg-brand-500/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setTab('red')}
          aria-label="Mi red"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
            tab === 'red'
              ? 'border-brand-400/60 bg-brand-500 !text-white'
              : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <Network className="h-4 w-4 shrink-0" />
          <span>Red</span>
        </button>
      </div>

      {/* Buscador */}
      {tab !== 'red' && (
        <div className="relative mb-5 sm:mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, área, rubro o universidad"
            className="pl-12"
          />
        </div>
      )}

      {tab === 'red' ? (
        <NetworkTab
          companies={companies.filter((c) => followingIds.has(c.id))}
          students={students.filter((s) => followingIds.has(s.id))}
          ambassadors={ambassadors.filter((a) => followingIds.has(a.id))}
          requests={connectionRequests.filter(
            (request) => request.status === 'pending' && request.recipient_id === uid
          )}
          allStudents={students}
          onRespond={respondConnection}
          onOpen={setSelected}
        />
      ) : count === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Sin resultados"
          description="No encontramos perfiles que coincidan con tu búsqueda."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {tab === 'estudiantes' &&
            filteredStudents.map((r) => (
              <ProfileCard
                key={r.id}
                avatar={<Avatar url={r.avatar_url} name={r.profile?.full_name || 'Estudiante'} />}
                title={r.profile?.full_name || 'Estudiante'}
                subtitle={[r.career, r.year && `${r.year}° año`, r.university].filter(Boolean).join(' · ') || 'Estudiante'}
                tags={(r.skills ?? []).slice(0, 3)}
                onClick={() => setSelected({ type: 'estudiantes', row: r })}
                badge={r.verified ? <VerifiedBadge verified small /> : undefined}
              />
            ))}
          {tab === 'empresas' &&
            filteredCompanies.map((r) => (
              <ProfileCard
                key={r.id}
                avatar={<Avatar url={r.avatar_url} name={r.company_name || 'Empresa'} />}
                title={r.company_name || 'Empresa'}
                subtitle={[r.industry, r.size && `${r.size} empleados`].filter(Boolean).join(' · ') || 'Empresa'}
                tags={[]}
                onClick={() => setSelected({ type: 'empresas', row: r })}
                badge={r.verified ? <VerifiedBadge verified small /> : undefined}
              />
            ))}
          {tab === 'embajadores' &&
            filteredAmbassadors.map((r) => (
              <ProfileCard
                key={r.id}
                avatar={<Avatar url={r.logo_url} name={r.org_name || 'Comunidad'} />}
                title={r.org_name || 'Comunidad'}
                subtitle={[orgTypeLabel(r.org_type), r.university].filter(Boolean).join(' · ')}
                tags={r.reach ? [`${r.reach} de alcance`] : []}
                onClick={() => setSelected({ type: 'embajadores', row: r })}
                badge={r.verified ? <VerifiedBadge verified small /> : undefined}
              />
            ))}
        </div>
      )}

      {selected && (
        <DetailModal
          selected={selected}
          onClose={() => setSelected(null)}
          onMessage={handleMessage}
          isFollowing={followingIds.has(selected.row.id)}
          onToggleFollow={() => toggleFollow(selected.row.id)}
          connectionState={connectionStateFor(selected.row.id)}
          onToggleConnection={() => toggleConnection(selected.row.id)}
        />
      )}
    </div>
  );
}

function ProfileCard({
  avatar,
  title,
  subtitle,
  tags,
  onClick,
  badge,
}: {
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
  tags: string[];
  onClick: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="text-left">
      <Card hover className="h-full cursor-pointer">
        <div className="flex items-start gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-white">{title}</h3>
              {badge}
            </div>
            <p className="mt-0.5 text-[13px] leading-snug text-white/55 line-clamp-2">{subtitle}</p>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-white/35">Ver perfil →</p>
      </Card>
    </button>
  );
}

function DetailModal({
  selected,
  onClose,
  onMessage,
  isFollowing,
  onToggleFollow,
  connectionState,
  onToggleConnection,
}: {
  selected: Selected;
  onClose: () => void;
  onMessage: (id: string, name: string, avatar?: string | null) => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  connectionState: ConnectionState;
  onToggleConnection: () => void;
}) {
  useModalGuard();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="dash-panel relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>

        {selected.type === 'estudiantes' && (
          <StudentDetail row={selected.row} onMessage={onMessage} connectionState={connectionState} onToggleConnection={onToggleConnection} />
        )}
        {selected.type === 'empresas' && (
          <CompanyDetail row={selected.row} onMessage={onMessage} isFollowing={isFollowing} onToggleFollow={onToggleFollow} />
        )}
        {selected.type === 'embajadores' && (
          <AmbassadorDetail row={selected.row} onMessage={onMessage} isFollowing={isFollowing} onToggleFollow={onToggleFollow} />
        )}
      </div>
    </div>
  );
}

/** Botón Seguir / Conectar reutilizable. */
function FollowButton({
  isFollowing,
  onClick,
  followLabel,
  followingLabel,
}: {
  isFollowing: boolean;
  onClick: () => void;
  followLabel: string;
  followingLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        isFollowing
          ? 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10'
          : 'inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-brand-400'
      }
    >
      {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {isFollowing ? followingLabel : followLabel}
    </button>
  );
}

function ConnectionButton({ state, onClick }: { state: ConnectionState; onClick: () => void }) {
  const label =
    state === 'connected'
      ? 'Conectado'
      : state === 'sent'
        ? 'Solicitud enviada'
        : state === 'received'
          ? 'Aceptar conexión'
          : 'Conectar';
  const passive = state === 'connected' || state === 'sent';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'connected'}
      title={state === 'sent' ? 'Tocá para cancelar la solicitud' : undefined}
      className={
        passive
          ? 'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-default'
          : 'inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-brand-400'
      }
    >
      {state === 'sent' ? <Clock3 size={16} /> : state === 'connected' ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">{title}</p>
      {children}
    </div>
  );
}

function LinkChip({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {icon} {label}
    </a>
  );
}

function StudentDetail({ row, onMessage, connectionState, onToggleConnection }: { row: StudentRow; onMessage: (id: string, name: string, avatar?: string | null) => void; connectionState: ConnectionState; onToggleConnection: () => void }) {
  const name = row.profile?.full_name || 'Estudiante';
  return (
    <>
      <div className="mb-5 flex items-center gap-4">
        <Avatar url={row.avatar_url} name={name} className="h-16 w-16" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            {row.verified && <VerifiedBadge verified />}
          </div>
          <p className="mt-0.5 text-sm text-white/60">
            {[row.career, row.year && `${row.year}° año`, row.university].filter(Boolean).join(' · ') || 'Estudiante'}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/60">
        {row.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} /> {row.location}
          </span>
        )}
        {row.area && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={15} /> {row.area}
          </span>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <ConnectionButton state={connectionState} onClick={onToggleConnection} />
        <button
          onClick={() => onMessage(row.id, name, row.avatar_url)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-950 hover:text-white"
        >
          <MessageSquare size={16} /> Enviar mensaje
        </button>
        {row.profile?.email && (
          <a
            href={`mailto:${row.profile.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Mail size={16} /> Email
          </a>
        )}
        {row.phone && (
          <a
            href={`tel:${row.phone}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Phone size={16} /> {row.phone}
          </a>
        )}
        {row.phone && (
          <a
            href={`https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <MessageSquare size={16} /> WhatsApp
          </a>
        )}
        <ReportButton targetType="profile" targetId={row.id} variant="button" />
      </div>

      {row.skills && row.skills.length > 0 && (
        <Section title="Habilidades">
          <div className="flex flex-wrap gap-2">
            {row.skills.map((s) => (
              <span key={s} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white/80">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {row.bio && (
        <Section title="Sobre el estudiante">
          <p className="text-sm leading-relaxed text-white/70"><EmojiText text={row.bio} /></p>
        </Section>
      )}

      {(safeHref(row.linkedin_url) || safeHref(row.github_url) || safeHref(row.portfolio_url) || instaHref(row.instagram_url)) && (
        <Section title="Links">
          <div className="flex flex-wrap gap-3">
            {instaHref(row.instagram_url) && (
              <LinkChip href={instaHref(row.instagram_url)!} label="Instagram" icon={<Link2 size={15} />} />
            )}
            {safeHref(row.linkedin_url) && (
              <LinkChip href={safeHref(row.linkedin_url)!} label="LinkedIn" icon={<Link2 size={15} />} />
            )}
            {safeHref(row.github_url) && (
              <LinkChip href={safeHref(row.github_url)!} label="GitHub" icon={<Link2 size={15} />} />
            )}
            {safeHref(row.portfolio_url) && (
              <LinkChip href={safeHref(row.portfolio_url)!} label="Portfolio" icon={<Globe size={15} />} />
            )}
          </div>
        </Section>
      )}

      <div className="mt-5">
        <UserPosts authorId={row.id} />
      </div>
    </>
  );
}

function CompanyDetail({ row, onMessage, isFollowing, onToggleFollow }: { row: CompanyRow; onMessage: (id: string, name: string, avatar?: string | null) => void; isFollowing: boolean; onToggleFollow: () => void }) {
  const name = row.company_name || 'Empresa';
  return (
    <>
      <div className="mb-5 flex items-center gap-4">
        <Avatar url={row.avatar_url} name={name} className="h-16 w-16" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            {row.verified && <VerifiedBadge verified />}
          </div>
          <p className="mt-0.5 text-sm text-white/60">
            {[row.industry, row.size && `${row.size} empleados`].filter(Boolean).join(' · ') || 'Empresa'}
          </p>
        </div>
      </div>

      {row.description && (
        <Section title="Sobre la empresa">
          <p className="text-sm leading-relaxed text-white/70"><EmojiText text={row.description} /></p>
        </Section>
      )}

      <div className="flex flex-wrap gap-3">
        <FollowButton
          isFollowing={isFollowing}
          onClick={onToggleFollow}
          followLabel="Seguir"
          followingLabel="Siguiendo"
        />
        <button
          onClick={() => onMessage(row.id, name, row.avatar_url)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-950 hover:text-white"
        >
          <MessageSquare size={16} /> Enviar mensaje
        </button>
        {row.profile?.email && (
          <a
            href={`mailto:${row.profile.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Mail size={16} /> Email
          </a>
        )}
        {safeHref(row.website) && (
          <LinkChip href={safeHref(row.website)!} label="Sitio web" icon={<Globe size={15} />} />
        )}
        <ReportButton targetType="profile" targetId={row.id} variant="button" />
      </div>

      <div className="mt-5">
        <UserPosts authorId={row.id} />
      </div>
    </>
  );
}

function AmbassadorDetail({ row, onMessage, isFollowing, onToggleFollow }: { row: AmbRow; onMessage: (id: string, name: string, avatar?: string | null) => void; isFollowing: boolean; onToggleFollow: () => void }) {
  const name = row.org_name || 'Comunidad';
  return (
    <>
      <div className="mb-5 flex items-center gap-4">
        <Avatar url={row.logo_url} name={name} className="h-16 w-16" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <VerifiedBadge verified={!!row.verified} />
          </div>
          <p className="mt-0.5 text-sm text-white/60">
            {[orgTypeLabel(row.org_type), row.university].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {row.reach && (
        <Section title="Alcance">
          <p className="text-sm text-white/80">{row.reach}</p>
        </Section>
      )}

      {row.description && (
        <Section title="Sobre la comunidad">
          <p className="text-sm leading-relaxed text-white/70"><EmojiText text={row.description} /></p>
        </Section>
      )}

      <div className="flex flex-wrap gap-3">
        <FollowButton
          isFollowing={isFollowing}
          onClick={onToggleFollow}
          followLabel="Seguir"
          followingLabel="Siguiendo"
        />
        <button
          onClick={() => onMessage(row.id, name, row.logo_url)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-950 hover:text-white"
        >
          <MessageSquare size={16} /> Enviar mensaje
        </button>
        {safeHref(row.instagram_url) && (
          <LinkChip href={safeHref(row.instagram_url)!} label="Instagram" icon={<Link2 size={15} />} />
        )}
        <ReportButton targetType="profile" targetId={row.id} variant="button" />
      </div>

      <div className="mt-5">
        <UserPosts authorId={row.id} />
      </div>
    </>
  );
}

/* ─────────────────────────── Pestaña "Red" ─────────────────────────── */

function NetworkTab({
  companies,
  students,
  ambassadors,
  requests,
  allStudents,
  onRespond,
  onOpen,
}: {
  companies: CompanyRow[];
  students: StudentRow[];
  ambassadors: AmbRow[];
  requests: ConnectionRequest[];
  allStudents: StudentRow[];
  onRespond: (request: ConnectionRequest, accept: boolean) => void;
  onOpen: (s: Selected) => void;
}) {
  const followedIds = useMemo(
    () => [
      ...companies.map((c) => c.id),
      ...students.map((s) => s.id),
      ...ambassadors.map((a) => a.id),
    ],
    [companies, students, ambassadors]
  );

  // Mapa id -> {nombre, avatar} para mostrar autor en el feed.
  const people = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string | null }>();
    companies.forEach((c) => m.set(c.id, { name: c.company_name || 'Empresa', avatar: c.avatar_url ?? null }));
    students.forEach((s) => m.set(s.id, { name: s.profile?.full_name || 'Estudiante', avatar: s.avatar_url ?? null }));
    ambassadors.forEach((a) => m.set(a.id, { name: a.org_name || 'Comunidad', avatar: a.logo_url ?? null }));
    return m;
  }, [companies, students, ambassadors]);

  const [feed, setFeed] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (followedIds.length === 0) {
        setFeed([]);
        setFeedLoading(false);
        return;
      }
      setFeedLoading(true);
      const { data } = await supabase
        .from('posts')
        .select('*')
        .in('author_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(40);
      if (!active) return;
      setFeed((data as Post[]) ?? []);
      setFeedLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [followedIds]);

  const nothing =
    companies.length === 0 && students.length === 0 && ambassadors.length === 0 && requests.length === 0;

  if (nothing) {
    return (
      <EmptyState
        icon={<Network className="h-6 w-6" />}
        title="Todavía no seguís a nadie"
        description="Seguí empresas o conectá con estudiantes desde las otras pestañas para armar tu red y ver sus novedades acá."
      />
    );
  }

  return (
    <div className="space-y-5">
      {requests.length > 0 && (
        <NetSection title={`Solicitudes (${requests.length})`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {requests.map((request) => {
              const student = allStudents.find((row) => row.id === request.requester_id);
              const name = student?.profile?.full_name || 'Estudiante';
              return (
                <div
                  key={request.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                >
                  <Avatar url={student?.avatar_url} name={name} className="h-9 w-9" />
                  <button
                    type="button"
                    onClick={() => student && onOpen({ type: 'estudiantes', row: student })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-semibold text-white">{name}</span>
                    <span className="block text-[11px] text-white/45">Quiere conectar con vos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onRespond(request, false)}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-white/55 hover:bg-white/10"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onRespond(request, true)}
                    className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold !text-white"
                  >
                    Aceptar
                  </button>
                </div>
              );
            })}
          </div>
        </NetSection>
      )}

      {/* Empresas y Estudiantes: apilados en mobile (evita cortes), lado a lado en sm+ */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <NetSection title={`Empresas (${companies.length})`}>
          {companies.length === 0 ? (
            <p className="text-xs text-white/40">No seguís empresas todavía.</p>
          ) : (
            <div className="grid max-h-[240px] gap-2 overflow-y-auto pr-1 sm:max-h-[300px]">
              {companies.map((r) => (
                <NetItem
                  key={r.id}
                  avatar={<Avatar url={r.avatar_url} name={r.company_name || 'Empresa'} className="h-8 w-8" />}
                  title={r.company_name || 'Empresa'}
                  subtitle={[r.industry, r.size && `${r.size} empl.`].filter(Boolean).join(' · ')}
                  onClick={() => onOpen({ type: 'empresas', row: r })}
                  badge={r.verified ? <VerifiedBadge verified small /> : undefined}
                />
              ))}
            </div>
          )}
        </NetSection>

        <NetSection title={`Amigos (${students.length})`}>
          {students.length === 0 ? (
            <p className="text-xs text-white/40">Todavía no conectaste con estudiantes.</p>
          ) : (
            <div className="grid max-h-[240px] gap-2 overflow-y-auto pr-1 sm:max-h-[300px]">
              {students.map((r) => (
                <NetItem
                  key={r.id}
                  avatar={<Avatar url={r.avatar_url} name={r.profile?.full_name || 'Estudiante'} className="h-8 w-8" />}
                  title={r.profile?.full_name || 'Estudiante'}
                  subtitle={[r.career, r.year && `${r.year}°`].filter(Boolean).join(' · ')}
                  onClick={() => onOpen({ type: 'estudiantes', row: r })}
                  badge={r.verified ? <VerifiedBadge verified small /> : undefined}
                />
              ))}
            </div>
          )}
        </NetSection>
      </div>

      {/* Embajadores (si seguís alguno) */}
      {ambassadors.length > 0 && (
        <NetSection title={`Embajadores que seguís (${ambassadors.length})`}>
          <div className="grid max-h-[300px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {ambassadors.map((r) => (
              <NetItem
                key={r.id}
                avatar={<Avatar url={r.logo_url} name={r.org_name || 'Comunidad'} className="h-8 w-8" />}
                title={r.org_name || 'Comunidad'}
                subtitle={orgTypeLabel(r.org_type)}
                onClick={() => onOpen({ type: 'embajadores', row: r })}
                badge={<VerifiedBadge verified small />}
              />
            ))}
          </div>
        </NetSection>
      )}

      <NetSection title="Novedades de tu red">
        {feedLoading ? (
          <Card>
            <p className="text-sm text-white/50">Cargando novedades…</p>
          </Card>
        ) : feed.length === 0 ? (
          <Card>
            <p className="text-sm text-white/55">
              Todavía no hay novedades de las personas y empresas que seguís.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {feed.map((p) => (
              <FeedCard key={p.id} post={p} person={people.get(p.author_id)} />
            ))}
          </div>
        )}
      </NetSection>
    </div>
  );
}

function NetSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">{title}</h2>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && children}
    </section>
  );
}

/** Fila compacta de persona/empresa para la pestaña Red (mobile-friendly). */
function NetItem({
  avatar,
  title,
  subtitle,
  onClick,
  badge,
}: {
  avatar: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:bg-white/[0.06]"
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-white">{title}</p>
          {badge}
        </div>
        {subtitle && <p className="truncate text-[11px] leading-tight text-white/50">{subtitle}</p>}
      </div>
    </button>
  );
}

function FeedCard({ post, person }: { post: Post; person?: { name: string; avatar: string | null } }) {
  const name = person?.name || post.author_name || 'Usuario';
  const date = new Date(post.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  return (
    <Card className="flex flex-col">
      <div className="mb-2 flex items-center gap-2.5">
        <Avatar url={person?.avatar} name={name} className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/45">{date}</p>
        </div>
      </div>
      <h3 className="text-base font-semibold text-white">{post.title}</h3>
      <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-white/70">{post.body}</p>
      {post.link_url && (
        <div className="mt-2">
          <LinkPreview url={post.link_url} />
        </div>
      )}
      <PostInteractions targetType="post" targetId={post.id} />
    </Card>
  );
}
