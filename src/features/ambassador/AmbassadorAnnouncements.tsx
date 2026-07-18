// Embajador: pasantías para difundir con tu comunidad
import { useEffect, useMemo, useState } from 'react';
import {
  Building2, MapPin, Megaphone, Check, Copy, Send,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { InternshipWithCompany, Modality } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default function AmbassadorAnnouncements() {
  const { session } = useAuth();
  const [items, setItems] = useState<InternshipWithCompany[]>([]);
  const [diffusedIds, setDiffusedIds] = useState<Set<string>>(new Set());
  const [broadcastIds, setBroadcastIds] = useState<Set<string>>(new Set());
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [onlyForMe, setOnlyForMe] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const uid = session!.user.id;
        const [{ data: list }, { data: diff }, { data: bc }, { data: prof }] = await Promise.all([
          supabase
            .from('internships')
            .select('*, company:company_profiles(company_name, industry)')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase.from('internship_diffusions').select('internship_id').eq('ambassador_id', uid),
          supabase.from('internship_broadcasts').select('internship_id').eq('ambassador_id', uid),
          supabase.from('ambassador_profiles').select('verified').eq('id', uid).single(),
        ]);
        if (!active) return;
        setItems((list as InternshipWithCompany[]) ?? []);
        setDiffusedIds(new Set((diff ?? []).map((d) => d.internship_id)));
        setBroadcastIds(new Set((bc ?? []).map((b) => b.internship_id)));
        setVerified(!!(prof as { verified: boolean } | null)?.verified);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session]);

  const list = useMemo(
    () => (onlyForMe ? items.filter((i) => broadcastIds.has(i.id)) : items),
    [items, onlyForMe, broadcastIds]
  );

  async function markDiffused(i: InternshipWithCompany) {
    if (diffusedIds.has(i.id)) return;
    setDiffusedIds((prev) => new Set(prev).add(i.id));
    await supabase
      .from('internship_diffusions')
      .insert({ ambassador_id: session!.user.id, internship_id: i.id });
  }

  async function copyCaption(i: InternshipWithCompany) {
    const caption =
      `Nueva PASANTÍA disponible\n\n` +
      `${i.title}\n` +
      `${i.company?.company_name || 'Empresa'}\n` +
      `${modalityLabel[i.modality]}${i.location ? ' · ' + i.location : ''}\n` +
      `Área: ${i.area}\n\n` +
      `Postulate en PasantIA\n#pasantias #empleojoven #universitarios`;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(i.id);
      setTimeout(() => setCopied((c) => (c === i.id ? null : c)), 2000);
    } catch { /* ignore */ }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Pasantías para difundir"
        description="Compartí estas oportunidades con tu comunidad y sumá puntos."
      />

      {!verified && (
        <Card className="mb-5 border-amber-300/25 bg-amber-400/[0.07]">
          <p className="text-sm text-white/80">
            Tu cuenta todavía no está verificada. Vas a poder registrar difusiones cuando el equipo valide tu comunidad.
          </p>
        </Card>
      )}

      <div className="mb-5 flex gap-2">
        <FilterChip active={!onlyForMe} onClick={() => setOnlyForMe(false)}>Todas</FilterChip>
        <FilterChip active={onlyForMe} onClick={() => setOnlyForMe(true)}>
          Dirigidas a mi comunidad ({broadcastIds.size})
        </FilterChip>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No hay pasantías para difundir"
          description="Cuando las empresas publiquen nuevas oportunidades aparecerán acá."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => {
            const done = diffusedIds.has(i.id);
            const forMe = broadcastIds.has(i.id);
            return (
              <Card key={i.id} hover className="flex flex-col">
                <div className="mb-2 flex items-center justify-between gap-2 text-sm text-white/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{i.company?.company_name || 'Empresa'}</span>
                  </div>
                  {forMe && (
                    <span className="shrink-0 rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-0.5 text-[11px] font-medium text-violet-200">
                      Te la enviaron
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold leading-snug text-white">{i.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">{i.area}</span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                    {modalityLabel[i.modality]}
                  </span>
                  {i.location && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                      <MapPin className="h-3 w-3" /> {i.location}
                    </span>
                  )}
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-white/60">{i.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => copyCaption(i)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {copied === i.id ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    {copied === i.id ? 'Copiado' : 'Copiar texto'}
                  </button>
                  {done ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3.5 py-2 text-sm font-medium text-emerald-200">
                      <Check className="h-4 w-4" /> Difundida
                    </span>
                  ) : (
                    <button
                      onClick={() => markDiffused(i)}
                      disabled={!verified}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-950 hover:text-white disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" /> Marcar difundida
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active ? 'border-white bg-white text-brand-600' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type {
  InternshipWithCompany,
  Modality,
  AmbassadorPost,
} from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import CreateAmbassadorPost from './CreateAmbassadorPost';

/* ─── Helpers ─── */
const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

type Tab = 'mis-anuncios' | 'difundir';

/* ════════════════════════════════════════════ */
export default function AmbassadorAnnouncements() {
  const [tab, setTab] = useState<Tab>('mis-anuncios');

  return (
    <div>
      <PageHeader
        title="Anuncios"
        description="Publicá tus propios anuncios o difundí pasantías con tu comunidad."
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <TabChip active={tab === 'mis-anuncios'} onClick={() => setTab('mis-anuncios')}>
          Mis anuncios
        </TabChip>
        <TabChip active={tab === 'difundir'} onClick={() => setTab('difundir')}>
          Pasantías para difundir
        </TabChip>
      </div>

      {tab === 'mis-anuncios' && <MisAnuncios />}
      {tab === 'difundir' && <DifundirPasantias />}
    </div>
  );
}

/* ════════ Tab 1: Mis anuncios ════════ */
function MisAnuncios() {
  const { session } = useAuth();
  const [refetch, setRefetch] = useState(0);
  const [posts, setPosts] = useState<AmbassadorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('ambassador_posts')
          .select('*')
          .eq('ambassador_id', session!.user.id)
          .order('created_at', { ascending: false });
        if (active) setPosts((data as AmbassadorPost[]) ?? []);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session, refetch]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await supabase.from('ambassador_posts').delete().eq('id', id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <Button
          as="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancelar' : 'Nuevo anuncio'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateAmbassadorPost
            onPostCreated={() => {
              setShowForm(false);
              setRefetch((p) => p + 1);
            }}
          />
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Todavía no publicaste nada"
          description="Creá tu primer anuncio para compartirlo con tu comunidad."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col">
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              )}
              {post.title && (
                <h3 className="mb-1 font-semibold text-white">{post.title}</h3>
              )}
              <p className="flex-1 text-sm text-white/65">{post.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-white/35">
                  {new Date(post.created_at).toLocaleDateString('es-AR')}
                </span>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-red-300"
                >
                  {deleting === post.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════ Tab 2: Difundir pasantías ════════ */
function DifundirPasantias() {
  const { session } = useAuth();
  const [items, setItems] = useState<InternshipWithCompany[]>([]);
  const [diffusedIds, setDiffusedIds] = useState<Set<string>>(new Set());
  const [broadcastIds, setBroadcastIds] = useState<Set<string>>(new Set());
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [onlyForMe, setOnlyForMe] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const uid = session!.user.id;
        const [{ data: list }, { data: diff }, { data: bc }, { data: prof }] = await Promise.all([
          supabase
            .from('internships')
            .select('*, company:company_profiles(company_name, industry)')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase.from('internship_diffusions').select('internship_id').eq('ambassador_id', uid),
          supabase.from('internship_broadcasts').select('internship_id').eq('ambassador_id', uid),
          supabase.from('ambassador_profiles').select('verified').eq('id', uid).single(),
        ]);
        if (!active) return;
        setItems((list as InternshipWithCompany[]) ?? []);
        setDiffusedIds(new Set((diff ?? []).map((d) => d.internship_id)));
        setBroadcastIds(new Set((bc ?? []).map((b) => b.internship_id)));
        setVerified(!!(prof as { verified: boolean } | null)?.verified);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session]);

  const list = useMemo(
    () => (onlyForMe ? items.filter((i) => broadcastIds.has(i.id)) : items),
    [items, onlyForMe, broadcastIds]
  );

  async function markDiffused(i: InternshipWithCompany) {
    if (diffusedIds.has(i.id)) return;
    setDiffusedIds((prev) => new Set(prev).add(i.id));
    await supabase
      .from('internship_diffusions')
      .insert({ ambassador_id: session!.user.id, internship_id: i.id });
  }

  async function copyCaption(i: InternshipWithCompany) {
    const caption =
      `Nueva PASANTÍA disponible\n\n` +
      `${i.title}\n` +
      `${i.company?.company_name || 'Empresa'}\n` +
      `${modalityLabel[i.modality]}${i.location ? ' · ' + i.location : ''}\n` +
      `Área: ${i.area}\n\n` +
      `Postulate en PasantIA\n#pasantias #empleojoven #universitarios`;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(i.id);
      setTimeout(() => setCopied((c) => (c === i.id ? null : c)), 2000);
    } catch { /* ignore */ }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      {!verified && (
        <Card className="mb-5 border-amber-300/25 bg-amber-400/[0.07]">
          <p className="text-sm text-white/80">
            Tu cuenta todavía no está verificada. Vas a poder registrar difusiones cuando el equipo valide tu comunidad.
          </p>
        </Card>
      )}

      <div className="mb-5 flex gap-2">
        <TabChip active={!onlyForMe} onClick={() => setOnlyForMe(false)}>Todas</TabChip>
        <TabChip active={onlyForMe} onClick={() => setOnlyForMe(true)}>
          Dirigidas a mi comunidad ({broadcastIds.size})
        </TabChip>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No hay pasantías para difundir"
          description="Cuando las empresas publiquen nuevas oportunidades aparecerán acá."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => {
            const done = diffusedIds.has(i.id);
            const forMe = broadcastIds.has(i.id);
            return (
              <Card key={i.id} hover className="flex flex-col">
                <div className="mb-2 flex items-center justify-between gap-2 text-sm text-white/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{i.company?.company_name || 'Empresa'}</span>
                  </div>
                  {forMe && (
                    <span className="shrink-0 rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-0.5 text-[11px] font-medium text-violet-200">
                      Te la enviaron
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold leading-snug text-white">{i.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">{i.area}</span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                    {modalityLabel[i.modality]}
                  </span>
                  {i.location && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                      <MapPin className="h-3 w-3" /> {i.location}
                    </span>
                  )}
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-white/60">{i.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => copyCaption(i)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {copied === i.id ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    {copied === i.id ? 'Copiado' : 'Copiar texto'}
                  </button>
                  {done ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3.5 py-2 text-sm font-medium text-emerald-200">
                      <Check className="h-4 w-4" /> Difundida
                    </span>
                  ) : (
                    <button
                      onClick={() => markDiffused(i)}
                      disabled={!verified}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-950 hover:text-white disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" /> Marcar difundida
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Shared UI ─── */
function TabChip({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-white bg-white text-brand-600'
          : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
