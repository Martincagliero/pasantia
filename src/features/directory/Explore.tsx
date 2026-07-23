// Sección "Explorar perfiles": cualquier rol puede buscar y ver perfiles
// de estudiantes (públicos), empresas y embajadores (verificados).
import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type {
  StudentProfile,
  CompanyProfile,
  AmbassadorProfile,
  Post,
} from '../../lib/database.types';
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
  const { openChatWith } = useMessages();
  const { profile: viewer } = useAuth();
  const viewerRole = viewer?.role;
  const uid = viewer?.id ?? null;
  const [tab, setTab] = useState<Tab>('estudiantes');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbRow[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Selected | null>(null);

  // Cargar a quién sigue el usuario actual.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid);
      if (!active) return;
      setFollowingIds(new Set((data ?? []).map((f) => (f as { following_id: string }).following_id)));
    })();
    return () => {
      active = false;
    };
  }, [uid]);

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
        supabase.from('ambassador_profiles').select('*').eq('verified', true),
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
      students.filter((r) => {
        if (!q) return true;
        return [r.profile?.full_name, r.career, r.university, r.area, (r.skills ?? []).join(' ')]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      }),
    [students, q]
  );

  const filteredCompanies = useMemo(
    () =>
      companies.filter((r) => {
        if (!q) return true;
        return [r.company_name, r.industry, r.profile?.full_name, r.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      }),
    [companies, q]
  );

  const filteredAmbassadors = useMemo(
    () =>
      ambassadors.filter((r) => {
        if (!q) return true;
        return [r.org_name, r.university, orgTypeLabel(r.org_type), r.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      }),
    [ambassadors, q]
  );

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
        title="Explorar perfiles"
        description="Buscá y conocé a estudiantes, empresas y embajadores de la comunidad."
      />

      {/* Tabs */}
      <div className="mb-4 flex gap-1.5 sm:mb-5 sm:gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] font-medium transition sm:flex-none sm:px-4 sm:py-2 sm:text-sm ${
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
                badge={<VerifiedBadge verified />}
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
}: {
  selected: Selected;
  onClose: () => void;
  onMessage: (id: string, name: string, avatar?: string | null) => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
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
          <StudentDetail row={selected.row} onMessage={onMessage} isFollowing={isFollowing} onToggleFollow={onToggleFollow} />
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

function StudentDetail({ row, onMessage, isFollowing, onToggleFollow }: { row: StudentRow; onMessage: (id: string, name: string, avatar?: string | null) => void; isFollowing: boolean; onToggleFollow: () => void }) {
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
        <FollowButton
          isFollowing={isFollowing}
          onClick={onToggleFollow}
          followLabel="Conectar"
          followingLabel="Conectado"
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
          <p className="text-sm leading-relaxed text-white/70">{row.bio}</p>
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
          <p className="text-sm leading-relaxed text-white/70">{row.description}</p>
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
          <p className="text-sm leading-relaxed text-white/70">{row.description}</p>
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
  onOpen,
}: {
  companies: CompanyRow[];
  students: StudentRow[];
  ambassadors: AmbRow[];
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

  const nothing = companies.length === 0 && students.length === 0 && ambassadors.length === 0;

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
    <div className="space-y-7">
      {companies.length > 0 && (
        <NetSection title={`Empresas que seguís (${companies.length})`}>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {companies.map((r) => (
              <ProfileCard
                key={r.id}
                avatar={<Avatar url={r.avatar_url} name={r.company_name || 'Empresa'} />}
                title={r.company_name || 'Empresa'}
                subtitle={[r.industry, r.size && `${r.size} empleados`].filter(Boolean).join(' · ') || 'Empresa'}
                tags={[]}
                onClick={() => onOpen({ type: 'empresas', row: r })}
                badge={r.verified ? <VerifiedBadge verified small /> : undefined}
              />
            ))}
          </div>
        </NetSection>
      )}

      {students.length > 0 && (
        <NetSection title={`Amigos (${students.length})`}>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {students.map((r) => (
              <ProfileCard
                key={r.id}
                avatar={<Avatar url={r.avatar_url} name={r.profile?.full_name || 'Estudiante'} />}
                title={r.profile?.full_name || 'Estudiante'}
                subtitle={[r.career, r.year && `${r.year}° año`, r.university].filter(Boolean).join(' · ') || 'Estudiante'}
                tags={(r.skills ?? []).slice(0, 3)}
                onClick={() => onOpen({ type: 'estudiantes', row: r })}
                badge={r.verified ? <VerifiedBadge verified small /> : undefined}
              />
            ))}
          </div>
        </NetSection>
      )}

      {ambassadors.length > 0 && (
        <NetSection title={`Embajadores que seguís (${ambassadors.length})`}>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {ambassadors.map((r) => (
              <ProfileCard
                key={r.id}
                avatar={<Avatar url={r.logo_url} name={r.org_name || 'Comunidad'} />}
                title={r.org_name || 'Comunidad'}
                subtitle={[orgTypeLabel(r.org_type), r.university].filter(Boolean).join(' · ')}
                tags={[]}
                onClick={() => onOpen({ type: 'embajadores', row: r })}
                badge={<VerifiedBadge verified />}
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

function NetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">{title}</h2>
      {children}
    </section>
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
