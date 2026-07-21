// Vista interna de comunidad (estilo LinkedIn):
//  - Los estudiantes NO crean pasantías: solo comparten pasantías ya existentes.
//  - Pueden publicar anuncios / proyectos con links.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Loader2,
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  Megaphone,
  Share2,
  Link2,
  Trash2,
  Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthProvider';
import type {
  Community,
  CommunityPost,
  InternshipWithCompany,
  Modality,
  Role,
} from '../lib/database.types';
import { Button } from '../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../features/ui/primitives';
import { TextArea } from '../features/ui/Field';
import { ReportButton } from '../features/ui/ReportButton';
import { LinkPreview } from '../features/ui/LinkPreview';
import { PostInteractions } from '../features/ui/PostInteractions';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

const roleLabel: Record<Role, string> = {
  estudiante: 'Estudiante',
  empresa: 'Empresa',
  embajador: 'Embajador',
};

type SharedInternship = InternshipWithCompany & { published_at: string };

type FeedItem = { date: string } & (
  | { kind: 'post'; post: CommunityPost }
  | { kind: 'internship'; internship: SharedInternship }
);

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/** Solo devuelve URLs http/https para evitar esquemas peligrosos (javascript:, etc). */
function safeUrl(url: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : null;
}

function normalizeLink(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [shared, setShared] = useState<SharedInternship[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Composer
  const [tab, setTab] = useState<'anuncio' | 'pasantia' | null>(null);
  const [announcement, setAnnouncement] = useState({ content: '', link: '' });
  const [posting, setPosting] = useState(false);

  // Compartir pasantía existente
  const [available, setAvailable] = useState<InternshipWithCompany[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [shareQuery, setShareQuery] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);

  async function loadFeed() {
    const [{ data: postsData }, { data: ci }] = await Promise.all([
      supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('community_internships')
        .select('internship_id, published_at')
        .eq('community_id', id),
    ]);

    const nextPosts = (postsData as CommunityPost[]) ?? [];

    let nextShared: SharedInternship[] = [];
    const rows = (ci ?? []) as { internship_id: string; published_at: string }[];
    if (rows.length > 0) {
      const ids = rows.map((r) => r.internship_id);
      const { data: internData } = await supabase
        .from('internships')
        .select('*, company:company_profiles(company_name, industry)')
        .in('id', ids)
        .eq('is_active', true);
      const byId = new Map(
        ((internData as InternshipWithCompany[]) ?? []).map((i) => [i.id, i])
      );
      nextShared = rows
        .map((r) => {
          const it = byId.get(r.internship_id);
          return it ? ({ ...it, published_at: r.published_at } as SharedInternship) : null;
        })
        .filter((x): x is SharedInternship => !!x);
    }

    return { nextPosts, nextShared };
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: commData } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();
        const comm = (commData as Community) ?? null;
        if (!active) return;
        setCommunity(comm);

        const uid = session?.user.id;
        const creator = !!(uid && comm?.creator_id === uid);
        if (active) setIsCreator(creator);

        let member = creator;
        if (uid && !creator) {
          const { count } = await supabase
            .from('community_members')
            .select('id', { count: 'exact' })
            .eq('community_id', id)
            .eq('student_id', uid);
          member = (count ?? 0) > 0;
        }
        if (active) setIsMember(member);

        if (member) {
          const { nextPosts, nextShared } = await loadFeed();
          if (active) {
            setPosts(nextPosts);
            setShared(nextShared);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, session]);

  async function handleJoin() {
    if (!session) return;
    if (profile?.role !== 'estudiante') {
      alert('Solo estudiantes pueden unirse a comunidades');
      return;
    }
    setJoining(true);
    try {
      const { error } = await supabase.from('community_members').insert({
        community_id: id,
        student_id: session.user.id,
      });
      if (error && !error.message?.includes('duplicate')) throw error;
      setIsMember(true);
      setCommunity((c) => (c ? { ...c, members_count: (c.members_count ?? 0) + 1 } : c));
      const { nextPosts, nextShared } = await loadFeed();
      setPosts(nextPosts);
      setShared(nextShared);
    } catch (err: any) {
      alert('Error al unirse a la comunidad: ' + (err?.message ?? ''));
    } finally {
      setJoining(false);
    }
  }

  async function handlePublishAnnouncement() {
    if (!announcement.content.trim()) return;
    setPosting(true);
    try {
      const authorName =
        profile?.full_name ||
        (session?.user.user_metadata?.full_name as string | undefined) ||
        'Estudiante';
      const authorRole =
        profile?.role ||
        (session?.user.user_metadata?.role as Role | undefined) ||
        'estudiante';

      const { error } = await supabase.from('community_posts').insert({
        community_id: id,
        author_id: session!.user.id,
        author_name: authorName,
        author_role: authorRole,
        content: announcement.content.trim(),
        link_url: normalizeLink(announcement.link),
      });
      if (error) throw error;
      const { nextPosts, nextShared } = await loadFeed();
      setPosts(nextPosts);
      setShared(nextShared);
      setAnnouncement({ content: '', link: '' });
      setTab(null);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (/community_posts|does not exist|relation|schema cache/i.test(msg)) {
        alert(
          'Falta crear la tabla de anuncios en la base de datos.\n\n' +
            'Ejecutá la migración supabase/migracion-comunidades-posts.sql en el SQL Editor de Supabase y volvé a intentar.'
        );
      } else {
        alert('Error al publicar el anuncio: ' + msg);
      }
      console.error('community_posts insert error:', err);
    } finally {
      setPosting(false);
    }
  }

  async function openShareTab() {
    setTab('pasantia');
    if (available.length === 0) {
      setLoadingAvailable(true);
      try {
        const { data } = await supabase
          .from('internships')
          .select('*, company:company_profiles(company_name, industry)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        setAvailable((data as InternshipWithCompany[]) ?? []);
      } finally {
        setLoadingAvailable(false);
      }
    }
  }

  async function handleShareInternship(internshipId: string) {
    setSharingId(internshipId);
    try {
      const { error } = await supabase.from('community_internships').insert({
        community_id: id!,
        internship_id: internshipId,
      });
      if (error && !error.message?.includes('duplicate')) throw error;
      const { nextPosts, nextShared } = await loadFeed();
      setPosts(nextPosts);
      setShared(nextShared);
    } catch (err: any) {
      alert('Error al compartir la pasantía: ' + (err?.message ?? ''));
    } finally {
      setSharingId(null);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      await supabase.from('community_posts').delete().eq('id', postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* ignore */ }
  }

  if (loading) return <PageLoader />;

  if (!community) {
    return (
      <div className="max-w-4xl">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Comunidad no encontrada"
          description="Es posible que haya sido eliminada o que el link no sea válido."
          action={
            <Button as="button" variant="secondary" size="sm" onClick={() => navigate('/app/comunidades')}>
              Volver a mis comunidades
            </Button>
          }
        />
      </div>
    );
  }

  const canAccess = isMember || isCreator;

  // Vista para no-miembros: unirse sin salir del dashboard.
  if (!canAccess) {
    return (
      <div className="max-w-xl">
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Users className="h-7 w-7 text-white/80" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{community.name}</h1>
          {community.description && (
            <p className="mx-auto mt-2 max-w-md text-[15px] text-white/60">{community.description}</p>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white/50">
            <Users className="h-4 w-4" />
            <span>
              {community.members_count} {community.members_count === 1 ? 'miembro' : 'miembros'}
            </span>
          </div>

          <p className="mx-auto mt-6 max-w-sm text-sm text-white/55">
            Unite para ver el feed interno, los anuncios y las pasantías que se comparten en esta comunidad.
          </p>

          <div className="mt-6">
            {profile?.role === 'estudiante' ? (
              <Button as="button" variant="primary" onClick={handleJoin} disabled={joining}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unirme a la comunidad'}
              </Button>
            ) : (
              <p className="text-sm text-white/50">
                Solo los estudiantes pueden unirse a las comunidades.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const sharedIds = new Set(shared.map((s) => s.id));
  const shareResults = available
    .filter((i) => !sharedIds.has(i.id))
    .filter((i) => {
      const q = shareQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.area.toLowerCase().includes(q) ||
        (i.company?.company_name ?? '').toLowerCase().includes(q)
      );
    });

  const feed: FeedItem[] = [
    ...posts.map((p) => ({ kind: 'post' as const, post: p, date: p.created_at })),
    ...shared.map((i) => ({ kind: 'internship' as const, internship: i, date: i.published_at })),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={community.name}
        description={community.description || 'Comunidad de estudiantes'}
      />

      <div className="mb-5 flex items-center gap-4 text-sm text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {community.members_count} miembros
        </span>
        {isMember && !isCreator && (
          <span className="inline-flex items-center gap-1.5 text-emerald-300/80">
            <CheckCircle2 className="h-4 w-4" />
            Sos miembro
          </span>
        )}
        <a
          href="/normas-comunidad"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 text-white/45 underline underline-offset-4 transition hover:text-white/70"
        >
          Normas de la comunidad
        </a>
      </div>

      {/* Composer */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab(tab === 'anuncio' ? null : 'anuncio')}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              tab === 'anuncio'
                ? 'border-brand-400/50 bg-brand-500/10 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
            }`}
          >
            <Megaphone className="h-[18px] w-[18px]" />
            Publicar anuncio
          </button>
          <button
            onClick={() => (tab === 'pasantia' ? setTab(null) : openShareTab())}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              tab === 'pasantia'
                ? 'border-brand-400/50 bg-brand-500/10 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
            }`}
          >
            <Share2 className="h-[18px] w-[18px]" />
            Compartir pasantía
          </button>
        </div>

        {/* Panel: anuncio / proyecto */}
        {tab === 'anuncio' && (
          <div className="mt-4 space-y-3">
            <TextArea
              value={announcement.content}
              onChange={(e) => setAnnouncement((a) => ({ ...a, content: e.target.value }))}
              placeholder="Compartí un anuncio, proyecto o novedad con tu comunidad…"
              rows={4}
            />
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5">
              <Link2 className="h-[18px] w-[18px] shrink-0 text-white/40" />
              <input
                value={announcement.link}
                onChange={(e) => setAnnouncement((a) => ({ ...a, link: e.target.value }))}
                placeholder="Link (opcional) — ej: https://…"
                className="w-full bg-transparent py-3 text-[15px] text-white placeholder:text-white/35 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button as="button" variant="secondary" size="sm" onClick={() => setTab(null)}>
                Cancelar
              </Button>
              <Button
                as="button"
                variant="primary"
                size="sm"
                onClick={handlePublishAnnouncement}
                disabled={posting || !announcement.content.trim()}
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publicar'}
              </Button>
            </div>
          </div>
        )}

        {/* Panel: compartir pasantía existente */}
        {tab === 'pasantia' && (
          <div className="mt-4">
            <p className="mb-3 text-sm text-white/55">
              Compartí una pasantía ya publicada por empresas o embajadores. No se crean pasantías nuevas.
            </p>
            <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5">
              <Search className="h-[18px] w-[18px] shrink-0 text-white/40" />
              <input
                value={shareQuery}
                onChange={(e) => setShareQuery(e.target.value)}
                placeholder="Buscar por título, área o empresa"
                className="w-full bg-transparent py-3 text-[15px] text-white placeholder:text-white/35 outline-none"
              />
            </div>

            {loadingAvailable ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
              </div>
            ) : shareResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/50">
                No hay pasantías disponibles para compartir.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {shareResults.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{i.title}</p>
                      <p className="truncate text-xs text-white/55">
                        {i.company?.company_name || 'Empresa'} · {i.area}
                      </p>
                    </div>
                    <Button
                      as="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleShareInternship(i.id)}
                      disabled={sharingId === i.id}
                    >
                      {sharingId === i.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" /> Compartir
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Feed */}
      {feed.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Todavía no hay nada por acá"
          description="Publicá un anuncio o compartí una pasantía disponible para arrancar el feed."
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {feed.map((item) =>
            item.kind === 'post' ? (
              <PostCard
                key={`post-${item.post.id}`}
                post={item.post}
                canDelete={item.post.author_id === session?.user.id}
                onDelete={() => handleDeletePost(item.post.id)}
              />
            ) : (
              <InternshipCard
                key={`int-${item.internship.id}`}
                internship={item.internship}
                onOpen={() => navigate(`/app/pasantias?id=${item.internship.id}`)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  canDelete,
  onDelete,
}: {
  post: CommunityPost;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const url = safeUrl(post.link_url);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
          {initials(post.author_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white">{post.author_name}</span>
            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] text-white/55">
              {roleLabel[post.author_role]}
            </span>
            <span className="ml-auto shrink-0 text-xs text-white/40">{formatDate(post.created_at)}</span>
            {canDelete ? (
              <button
                onClick={onDelete}
                className="shrink-0 rounded-lg p-1.5 text-white/35 transition hover:bg-white/10 hover:text-red-300"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <ReportButton targetType="community_post" targetId={post.id} />
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">
            {post.content}
          </p>
          {url && <LinkPreview url={url} className="mt-3 max-w-full" />}
          <PostInteractions targetType="community_post" targetId={post.id} />
        </div>
      </div>
    </Card>
  );
}

function InternshipCard({
  internship: i,
  onOpen,
}: {
  internship: SharedInternship;
  onOpen: () => void;
}) {
  return (
    <Card hover className="relative cursor-pointer">
      <div className="absolute right-3 top-3 z-10">
        <ReportButton targetType="internship" targetId={i.id} />
      </div>
      <button onClick={onOpen} className="w-full text-left">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-200">
          <Briefcase className="h-3 w-3" />
          Pasantía compartida
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-white/60" strokeWidth={1.75} />
              <span className="truncate text-sm text-white/60">
                {i.company?.company_name || 'Empresa'}
              </span>
            </div>
            <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">{i.title}</h3>
            <p className="mb-3 line-clamp-2 text-white/70">{i.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                {i.area}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                {modalityLabel[i.modality]}
              </span>
              {i.location && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <MapPin className="h-3 w-3" />
                  {i.location}
                </span>
              )}
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white">
            <Briefcase className="h-4 w-4" />
            Ver
          </span>
        </div>
      </button>
      <PostInteractions targetType="internship" targetId={i.id} />
    </Card>
  );
}
