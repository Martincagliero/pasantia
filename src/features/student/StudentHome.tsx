import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, BriefcaseBusiness, Building2, Check, Clock3, House, MessageSquare, Newspaper, Plus, UserCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ConnectionRequest, InternshipWithCompany, Post, Profile } from '../../lib/database.types';
import { Card, EmptyState, PageLoader } from '../ui/primitives';
import { PostInteractions } from '../ui/PostInteractions';
import { useAuth } from '../auth/AuthProvider';
import { LinkPreview } from '../ui/LinkPreview';
import { sendPushEvent } from '../../lib/notify';
import { InternshipDetailModal } from '../ui/InternshipDetailModal';
import { useMessages } from '../messages/MessagesProvider';
import { ApplyModal } from './BrowseInternships';
import { PostComposerModal } from '../posts/PostComposer';
import { SocialPostImages, SocialPostText } from '../posts/SocialPostContent';
import { PostActionsMenu } from '../posts/PostActionsMenu';
import { VerifiedBadge } from '../ambassador/VerifiedBadge';
import pasantiaLogo from '../../assets/logo.png';
import { PlanRestrictionDialog } from '../plans/PlanRestrictionDialog';
import { restrictionFromError, type PlanRestriction } from '../../lib/planRestrictions';

interface HomePost extends Post {
  author: { is_admin: boolean } | null;
}

interface HomeMember extends Pick<Profile, 'id' | 'full_name' | 'role' | 'created_at'> {
  avatarUrl: string | null;
  displayName: string;
}

type ConnectionState = 'none' | 'sent' | 'received' | 'connected';

type FeedItem =
  | { kind: 'post'; createdAt: string; post: HomePost }
  | { kind: 'internship'; createdAt: string; internship: InternshipWithCompany };

const roleLabel: Record<Profile['role'], string> = {
  estudiante: 'estudiante',
  empresa: 'empresa',
  embajador: 'comunidad',
};

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return new Date(value).toLocaleDateString('es-AR');
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
}

export default function StudentHome() {
  const { session, profile } = useAuth();
  const { openChatWith } = useMessages();
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [internships, setInternships] = useState<InternshipWithCompany[]>([]);
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<InternshipWithCompany | null>(null);
  const [detail, setDetail] = useState<InternshipWithCompany | null>(null);
  const [composing, setComposing] = useState(false);
  const [planRestriction, setPlanRestriction] = useState<PlanRestriction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [postsResult, internshipsResult, membersResult, followsResult, requestsResult, applicationsResult, savedResult] = await Promise.all([
        supabase
          .from('posts')
          .select('*, author:profiles!author_id(is_admin)')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('internships')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('profiles')
          .select('id, full_name, role, created_at')
          .neq('id', profile?.id ?? '')
          .order('created_at', { ascending: false })
          .limit(10),
        profile?.role === 'estudiante'
          ? supabase.from('follows').select('following_id').eq('follower_id', profile.id)
          : Promise.resolve({ data: [] }),
        profile?.role === 'estudiante'
          ? supabase
              .from('connection_requests')
              .select('*')
              .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
          : Promise.resolve({ data: [] }),
        supabase.from('applications').select('internship_id').eq('student_id', profile?.id ?? ''),
        supabase.from('saved_internships').select('internship_id').eq('student_id', profile?.id ?? ''),
      ]);
      if (!active) return;
      const memberRows = (membersResult.data as Omit<HomeMember, 'avatarUrl' | 'displayName'>[] | null) ?? [];
      const memberIds = memberRows.map((member) => member.id);
      const avatarById = new Map<string, string>();
      const companyNameById = new Map<string, string>();
      const internshipRows = (internshipsResult.data as InternshipWithCompany[] | null) ?? [];
      const companyIds = Array.from(new Set(internshipRows.map((internship) => internship.company_id)));
      const companyById = new Map<string, { company_name: string | null; industry: string | null; avatar_url: string | null }>();
      if (companyIds.length > 0) {
        const { data: internshipCompanies } = await supabase
          .from('company_profiles')
          .select('id, company_name, industry, avatar_url')
          .in('id', companyIds);
        for (const company of internshipCompanies ?? []) {
          companyById.set(company.id, {
            company_name: company.company_name,
            industry: company.industry,
            avatar_url: company.avatar_url,
          });
        }
      }
      if (memberIds.length > 0) {
        const [{ data: students }, { data: companies }, { data: ambassadors }] = await Promise.all([
          supabase.from('student_profiles').select('id, avatar_url').in('id', memberIds),
          supabase.from('company_profiles').select('id, avatar_url, company_name').in('id', memberIds),
          supabase.from('ambassador_profiles').select('id, logo_url').in('id', memberIds),
        ]);
        for (const row of [...(students ?? []), ...(companies ?? [])] as { id: string; avatar_url: string | null }[]) {
          if (row.avatar_url) avatarById.set(row.id, row.avatar_url);
        }
        for (const row of (ambassadors ?? []) as { id: string; logo_url: string | null }[]) {
          if (row.logo_url) avatarById.set(row.id, row.logo_url);
        }
        for (const row of (companies ?? []) as { id: string; company_name: string | null }[]) {
          if (row.company_name) companyNameById.set(row.id, row.company_name);
        }
      }
      if (!active) return;
      setPosts((postsResult.data as unknown as HomePost[] | null) ?? []);
      setInternships(internshipRows.map((internship) => ({ ...internship, company: companyById.get(internship.company_id) ?? null })));
      setMembers(memberRows.map((member) => ({
        ...member,
        avatarUrl: avatarById.get(member.id) ?? null,
        displayName: member.role === 'empresa'
          ? companyNameById.get(member.id) || member.full_name
          : member.full_name,
      })));
      setFollowingIds(new Set((followsResult.data ?? []).map((row) => (row as { following_id: string }).following_id)));
      setConnectionRequests((requestsResult.data as ConnectionRequest[] | null) ?? []);
      setAppliedIds(new Set((applicationsResult.data ?? []).map((row) => row.internship_id)));
      setSavedIds(new Set((savedResult.data ?? []).map((row) => row.internship_id)));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.role]);

  const feed = useMemo<FeedItem[]>(
    () =>
      [
        ...posts.map((post) => ({ kind: 'post' as const, createdAt: post.created_at, post })),
        ...internships.map((internship) => ({
          kind: 'internship' as const,
          createdAt: internship.created_at,
          internship,
        })),
      ]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 16),
    [posts, internships]
  );

  if (loading) return <PageLoader />;

  const firstName = (profile?.full_name || 'estudiante').split(' ')[0];
  const isStudent = profile?.role === 'estudiante';
  const isCommunity = profile?.role === 'embajador';
  const fullBleedCard = '!rounded-none !border-x-0 sm:!rounded-2xl sm:!border-x';

  function connectionStateFor(targetId: string): ConnectionState {
    if (followingIds.has(targetId)) return 'connected';
    const request = connectionRequests.find(
      (row) =>
        row.status === 'pending' &&
        ((row.requester_id === profile?.id && row.recipient_id === targetId) ||
          (row.recipient_id === profile?.id && row.requester_id === targetId))
    );
    if (!request) return 'none';
    return request.requester_id === profile?.id ? 'sent' : 'received';
  }

  async function toggleConnection(targetId: string) {
    if (!profile?.id || profile.role !== 'estudiante' || targetId === profile.id) return;
    const state = connectionStateFor(targetId);
    const existing = connectionRequests.find(
      (row) =>
        row.status === 'pending' &&
        ((row.requester_id === profile.id && row.recipient_id === targetId) ||
          (row.recipient_id === profile.id && row.requester_id === targetId))
    );
    if (state === 'connected') return;
    setConnectingId(targetId);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      if (state === 'received' && existing) {
        const { error } = await supabase.rpc('respond_connection_request', {
          p_request_id: existing.id,
          p_accept: true,
        }).abortSignal(controller.signal);
        if (error) throw error;
        setConnectionRequests((current) => current.filter((row) => row.id !== existing.id));
        setFollowingIds((current) => new Set(current).add(targetId));
        void sendPushEvent('connection_accepted', existing.id);
        return;
      }
      if (state === 'sent' && existing) {
        const { error } = await supabase
          .from('connection_requests')
          .delete()
          .eq('id', existing.id)
          .abortSignal(controller.signal);
        if (error) throw error;
        setConnectionRequests((current) => current.filter((row) => row.id !== existing.id));
        return;
      }
      const { data, error } = await supabase
        .rpc('request_connection', { p_recipient_id: targetId })
        .abortSignal(controller.signal);
      if (error) throw error;
      setConnectionRequests((current) => [
        ...current,
        {
          id: String(data),
          requester_id: profile.id,
          recipient_id: targetId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      void sendPushEvent('connection_request', String(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const restriction = restrictionFromError(error);
      if (restriction) {
        setPlanRestriction(restriction);
        return;
      }
      alert(
        controller.signal.aborted
          ? 'La conexión tardó demasiado. Revisá internet e intentá nuevamente.'
          : /does not exist|schema cache|function/i.test(message)
          ? 'Falta correr la migración de solicitudes de conexión en Supabase.'
          : 'No se pudo actualizar la conexión.'
      );
    } finally {
      window.clearTimeout(timeout);
      setConnectingId(null);
    }
  }

  async function toggleFollow(targetId: string) {
    if (!profile?.id || targetId === profile.id) return;
    const followed = followingIds.has(targetId);
    setConnectingId(targetId);
    setFollowingIds((current) => {
      const next = new Set(current);
      if (followed) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
    const { error } = followed
      ? await supabase.from('follows').delete().eq('follower_id', profile.id).eq('following_id', targetId)
      : await supabase.from('follows').insert({ follower_id: profile.id, following_id: targetId });
    if (error) {
      setFollowingIds((current) => {
        const next = new Set(current);
        if (followed) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      alert('No se pudo actualizar el seguimiento.');
    }
    setConnectingId(null);
  }

  async function toggleSave(internshipId: string) {
    if (!profile?.id) return;
    const saved = savedIds.has(internshipId);
    setSavedIds((current) => {
      const next = new Set(current);
      if (saved) next.delete(internshipId);
      else next.add(internshipId);
      return next;
    });
    if (saved) {
      await supabase.from('saved_internships').delete().eq('student_id', profile.id).eq('internship_id', internshipId);
    } else {
      await supabase.from('saved_internships').insert({ student_id: profile.id, internship_id: internshipId });
    }
  }

  return (
    <div className="-mx-4 max-w-5xl sm:mx-auto">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0">
          <Card className={`mb-3 sm:mb-4 ${fullBleedCard}`}>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white">Hola, {firstName}</h1>
              <p className="mt-0.5 text-xs font-normal text-white/50">Descubrí qué hay de nuevo para vos.</p>
            </div>
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="mt-3 flex w-full items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:bg-white/[0.06] sm:gap-3 sm:px-4 sm:py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white sm:h-9 sm:w-9">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
              </span>
              <span className="flex-1 truncate text-sm text-white/50">Publicá algo para tu red…</span>
            </button>
            <div className="mt-3 grid grid-cols-2 border-t border-white/10 pt-3">
              <Link to={isCommunity ? '/app/anuncios' : '/app/pasantias'} className="text-center text-xs font-medium text-white/60 transition hover:text-brand-500">
                {isCommunity ? 'Anuncios' : 'Pasantías'}
              </Link>
              <Link to="/app/explorar" className="border-l border-white/10 text-center text-xs font-medium text-white/60 transition hover:text-brand-500">
                {isCommunity ? 'Explorar perfiles' : 'Mi red'}
              </Link>
            </div>
          </Card>

          <Card className={`mb-3 p-0 sm:mb-4 lg:hidden ${fullBleedCard}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
              <h2 className="text-sm font-semibold text-white">Nuevos en PasantIA</h2>
              <Link to="/app/explorar" className="text-xs font-semibold text-brand-500">Ver todos</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto p-2.5">
              {members.slice(0, 5).map((member) => {
                const state = connectionStateFor(member.id);
                return (
                  <div key={member.id} className="flex min-w-[12rem] items-center gap-2.5 rounded-lg border border-white/8 p-2">
                    <Link to={`/app/explorar?u=${member.id}`} className="shrink-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.displayName} className="h-9 w-9 rounded-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-white/70">
                          {initials(member.displayName)}
                        </span>
                      )}
                    </Link>
                    <Link to={`/app/explorar?u=${member.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{member.displayName || 'Nuevo integrante'}</p>
                      <p className="truncate text-[11px] text-white/45">{roleLabel[member.role]}</p>
                    </Link>
                    {member.role === 'empresa' && (
                      <FollowButton
                        followed={followingIds.has(member.id)}
                        loading={connectingId === member.id}
                        compact
                        onClick={() => void toggleFollow(member.id)}
                      />
                    )}
                    {member.role === 'estudiante' && isStudent && (
                      <ConnectionButton
                        state={state}
                        loading={connectingId === member.id}
                        compact
                        onClick={() => void toggleConnection(member.id)}
                      />
                    )}
                    {member.role === 'estudiante' && isCommunity && (
                      <button
                        type="button"
                        onClick={() => openChatWith(member.id, member.full_name, member.avatarUrl)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/65 transition hover:bg-white/8"
                        title="Enviar mensaje"
                        aria-label={`Enviar mensaje a ${member.full_name}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="mb-3 flex items-center gap-3 sm:mb-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-medium text-white/40">Actividad reciente</span>
          </div>

          {feed.length === 0 ? (
            <EmptyState
              icon={<House className="h-5 w-5" />}
              title="Todavía no hay novedades"
              description="Las nuevas oportunidades y publicaciones van a aparecer acá."
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {feed.map((item) => {
            if (item.kind === 'post') {
              const verified = item.post.author?.is_admin === true;
              return (
                <Card key={`post-${item.post.id}`} className={`overflow-hidden p-0 ${fullBleedCard}`}>
                  <div className="p-3 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${verified ? 'bg-brand-500 text-white' : 'bg-white/8 text-white/65'}`}>
                      {verified ? (
                        <img src={pasantiaLogo} alt="PasantIA" className="h-full w-full object-cover" />
                      ) : (
                        <Newspaper className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold leading-tight text-white">
                          {verified ? 'PasantIA' : item.post.author_name || 'Usuario'}
                        </p>
                        {verified && <VerifiedBadge verified small />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {verified ? 'Aviso oficial de PasantIA' : 'Publicación en Novedades'} · {relativeTime(item.createdAt)}
                      </p>
                    </div>
                    <PostActionsMenu
                      post={item.post}
                      currentUserId={session?.user.id}
                      onDeleted={(postId) => setPosts((current) => current.filter((post) => post.id !== postId))}
                    />
                  </div>
                  {item.post.title && <h2 className="mt-3 text-base font-semibold leading-snug text-white sm:text-lg">{item.post.title}</h2>}
                  <p className={`${item.post.title ? 'mt-1.5' : 'mt-3'} whitespace-pre-wrap break-words text-sm leading-5 text-white/65`}>
                    <SocialPostText text={item.post.body} mentions={item.post.mentions} />
                  </p>
                  <SocialPostImages urls={item.post.image_urls} />
                  {item.post.link_url && <LinkPreview url={item.post.link_url} className="mt-3" />}
                  <PostInteractions targetType="post" targetId={item.post.id} sharePost={item.post} />
                  </div>
                  {verified && (
                    <div className="h-1 bg-gradient-to-r from-brand-700 via-brand-400 to-cyan-300" aria-hidden />
                  )}
                </Card>
              );
            }

            if (item.kind === 'internship') {
              return (
                <Card key={`internship-${item.internship.id}`} className={`overflow-hidden p-0 ${fullBleedCard}`} hover>
                  {item.internship.image_url && (
                    <img
                      src={item.internship.image_url}
                      alt={item.internship.title}
                      className="h-40 w-full object-cover sm:h-52"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="p-3 sm:p-5">
                  <div className="flex items-start gap-3">
                    {item.internship.company?.avatar_url ? (
                      <img
                        src={item.internship.company.avatar_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                        <Building2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.internship.company_name || item.internship.company?.company_name || 'Empresa en PasantIA'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/40">Publicó una oportunidad · {relativeTime(item.createdAt)}</p>
                    </div>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-white sm:text-lg">{item.internship.title}</h2>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-5 text-white/60">{item.internship.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-white/60">
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{item.internship.area}</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 capitalize">{item.internship.modality}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetail(item.internship)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/8"
                    >
                      Ver detalle
                    </button>
                    {isStudent && (appliedIds.has(item.internship.id) ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> Ya postulaste
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelected(item.internship)}
                        className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-400"
                      >
                        Postularme
                      </button>
                    ))}
                    {isStudent && <button
                      type="button"
                      onClick={() => void toggleSave(item.internship.id)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${savedIds.has(item.internship.id) ? 'border-brand-500/35 bg-brand-500/10 text-brand-500' : 'border-white/15 text-white/65 hover:bg-white/8'}`}
                      title={savedIds.has(item.internship.id) ? 'Quitar de guardadas' : 'Guardar pasantía'}
                      aria-label={savedIds.has(item.internship.id) ? 'Quitar de guardadas' : 'Guardar pasantía'}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${savedIds.has(item.internship.id) ? 'fill-current' : ''}`} />
                    </button>}
                    <button
                      type="button"
                      onClick={() => openChatWith(item.internship.company_id, item.internship.company_name || item.internship.company?.company_name || 'Empresa')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/8"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Mensaje
                    </button>
                  </div>
                  <PostInteractions targetType="internship" targetId={item.internship.id} />
                  </div>
                </Card>
              );
            }
              return null;
              })}
            </div>
          )}
        </section>

        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <Card className="p-0">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Nuevos en PasantIA</h2>
              <p className="mt-0.5 text-xs text-white/45">Personas y organizaciones que se sumaron.</p>
            </div>
            <div className="flex gap-3 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
              {members.slice(0, 5).map((member) => {
                const state = connectionStateFor(member.id);
                return (
                  <div key={member.id} className="rounded-lg p-2 transition hover:bg-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <Link to={`/app/explorar?u=${member.id}`} className="shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.displayName} className="h-10 w-10 rounded-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-xs font-bold text-white/70">
                            {initials(member.displayName)}
                          </span>
                        )}
                      </Link>
                      <Link to={`/app/explorar?u=${member.id}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{member.displayName || 'Nuevo integrante'}</p>
                        <p className="truncate text-xs text-white/45">{roleLabel[member.role]}</p>
                      </Link>
                    </div>
                    {member.role === 'empresa' && (
                      <FollowButton
                        followed={followingIds.has(member.id)}
                        loading={connectingId === member.id}
                        onClick={() => void toggleFollow(member.id)}
                      />
                    )}
                    {member.role === 'estudiante' && isStudent && (
                      <ConnectionButton
                        state={state}
                        loading={connectingId === member.id}
                        onClick={() => void toggleConnection(member.id)}
                      />
                    )}
                    {member.role === 'estudiante' && isCommunity && (
                      <button
                        type="button"
                        onClick={() => openChatWith(member.id, member.full_name, member.avatarUrl)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/8"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Mensaje
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <Link to="/app/explorar" className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs font-semibold text-brand-500 transition hover:bg-white/[0.04]">
              Explorar perfiles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          {isStudent && <Card className="mt-4 hidden lg:block">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-white">Encontrá tu próxima oportunidad</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/50">Explorá las búsquedas activas y guardá las que más te interesan.</p>
            <Link to="/app/pasantias" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline">
              Ver pasantías <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>}
        </aside>
      </div>
      {isStudent && selected && (
        <ApplyModal
          internship={selected}
          studentId={session!.user.id}
          onClose={() => setSelected(null)}
          onApplied={() => {
            setAppliedIds((current) => new Set(current).add(selected.id));
            setSelected(null);
          }}
        />
      )}
      {detail && (
        <InternshipDetailModal
          internship={detail}
          onClose={() => setDetail(null)}
          actions={isStudent ? (
            appliedIds.has(detail.id) ? (
              <span className="rounded-full border border-emerald-500/25 px-4 py-2 text-sm font-semibold text-emerald-400">Ya postulaste</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelected(detail);
                  setDetail(null);
                }}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Postularme
              </button>
            )
          ) : undefined}
        />
      )}

      {composing && profile && (
        <PostComposerModal
          authorId={profile.id}
          authorName={profile.full_name ?? ''}
          authorRole={profile.role}
          showCategory={false}
          onClose={() => setComposing(false)}
          onCreated={(post) => {
            setPosts((current) => [{ ...(post as HomePost), author: { is_admin: profile.is_admin ?? false } }, ...current]);
            setComposing(false);
          }}
        />
      )}
      <PlanRestrictionDialog restriction={planRestriction} onClose={() => setPlanRestriction(null)} />
    </div>
  );
}

function ConnectionButton({
  state,
  loading,
  compact = false,
  onClick,
}: {
  state: ConnectionState;
  loading: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const Icon = state === 'connected' ? UserCheck : state === 'sent' ? Clock3 : UserPlus;
  const label = state === 'connected' ? 'Conectado' : state === 'sent' ? 'Pendiente' : state === 'received' ? 'Aceptar' : 'Conectar';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || state === 'connected'}
      title={state === 'sent' ? 'Cancelar solicitud' : label}
      className={
        compact
          ? `flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-60 ${
              state === 'connected'
                ? 'border-emerald-500/20 text-emerald-600'
                : 'border-brand-500/25 text-brand-500 hover:bg-brand-500/8'
            }`
          : `mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
              state === 'connected'
                ? 'border-emerald-500/20 text-emerald-600'
                : 'border-brand-500/25 text-brand-500 hover:bg-brand-500/8'
            }`
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {!compact && (loading ? 'Cargando' : label)}
    </button>
  );
}

function FollowButton({
  followed,
  loading,
  compact = false,
  onClick,
}: {
  followed: boolean;
  loading: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={followed ? 'Dejar de seguir' : 'Seguir empresa'}
      aria-label={followed ? 'Dejar de seguir empresa' : 'Seguir empresa'}
      className={
        compact
          ? `flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-60 ${
              followed
                ? 'border-emerald-500/20 text-emerald-600'
                : 'border-brand-500/25 text-brand-500 hover:bg-brand-500/8'
            }`
          : `mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
              followed
                ? 'border-emerald-500/20 text-emerald-600'
                : 'border-brand-500/25 text-brand-500 hover:bg-brand-500/8'
            }`
      }
    >
      {followed ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {!compact && (loading ? 'Cargando' : followed ? 'Siguiendo' : 'Seguir')}
    </button>
  );
}
