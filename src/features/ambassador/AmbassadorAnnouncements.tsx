// Embajador: pasantías para difundir con tu comunidad
import { useEffect, useState } from 'react';
import { Building2, MapPin, Megaphone, Check, Send, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { InternshipWithCompany, Modality } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { AmbassadorInternshipForm } from './AmbassadorInternshipForm';
import { PostInteractions } from '../ui/PostInteractions';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

// Trae las pasantías activas SIN depender del embed a company_profiles
// (el embed puede fallar/ocultar filas). Junta el nombre de empresa aparte.
async function fetchActiveInternships(): Promise<InternshipWithCompany[]> {
  const { data: list } = await supabase
    .from('internships')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  const items = (list ?? []) as InternshipWithCompany[];
  if (items.length === 0) return [];
  const ids = Array.from(new Set(items.map((i) => i.company_id)));
  const { data: comps } = await supabase
    .from('company_profiles')
    .select('id, company_name, industry')
    .in('id', ids);
  const map = new Map(
    (comps as { id: string; company_name: string; industry: string | null }[] | null ?? []).map((c) => [
      c.id,
      { company_name: c.company_name, industry: c.industry },
    ])
  );
  return items.map((i) => ({ ...i, company: map.get(i.company_id) ?? null }));
}

export default function AmbassadorAnnouncements() {
  const { session } = useAuth();
  const [items, setItems] = useState<InternshipWithCompany[]>([]);
  const [diffusedIds, setDiffusedIds] = useState<Set<string>>(new Set());
  const [broadcastIds, setBroadcastIds] = useState<Set<string>>(new Set());
  const [ownIds, setOwnIds] = useState<Set<string>>(new Set());
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const uid = session!.user.id;
        const [items, { data: diff }, { data: bc }, { data: prof }, { data: own }] = await Promise.all([
          fetchActiveInternships(),
          supabase.from('internship_diffusions').select('internship_id').eq('ambassador_id', uid),
          supabase.from('internship_broadcasts').select('internship_id').eq('ambassador_id', uid),
          supabase.from('ambassador_profiles').select('verified').eq('id', uid).single(),
          supabase.from('internships').select('id').eq('company_id', uid),
        ]);
        if (!active) return;
        setItems(items);
        setDiffusedIds(new Set((diff ?? []).map((d) => d.internship_id)));
        setBroadcastIds(new Set((bc ?? []).map((b) => b.internship_id)));
        setOwnIds(new Set((own ?? []).map((o) => o.id)));
        setVerified(!!(prof as { verified: boolean } | null)?.verified);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session]);

  async function markDiffused(i: InternshipWithCompany) {
    if (diffusedIds.has(i.id)) return;
    setDiffusedIds((prev) => new Set(prev).add(i.id));
    await supabase
      .from('internship_diffusions')
      .insert({ ambassador_id: session!.user.id, internship_id: i.id });
  }

  async function deleteOwnInternship(id: string) {
    if (!confirm('¿Eliminar esta pasantía?')) return;
    await supabase.from('internships').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOwnIds((prev) => new Set([...prev].filter((oid) => oid !== id)));
  }

  async function handleInternshipCreated() {
    // Recargar la lista
    const uid = session!.user.id;
    setItems(await fetchActiveInternships());
    const { data: own } = await supabase.from('internships').select('id').eq('company_id', uid);
    setOwnIds(new Set((own ?? []).map((o) => o.id)));
    // La pasantía recién publicada ya cuenta como difundida (suma puntos).
    const { data: diff } = await supabase
      .from('internship_diffusions')
      .select('internship_id')
      .eq('ambassador_id', uid);
    setDiffusedIds(new Set((diff ?? []).map((d) => d.internship_id)));
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Pasantías para difundir"
        description="Compartí estas oportunidades con tu comunidad y sumá puntos."
        action={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Publicar pasantía
          </button>
        }
      />

      {showForm && (
        <AmbassadorInternshipForm
          onClose={() => setShowForm(false)}
          onCreated={handleInternshipCreated}
        />
      )}

      {!verified && (
        <Card className="mb-5 border-amber-300/25 bg-amber-400/[0.07]">
          <p className="text-sm text-white/80">
            Tu cuenta todavía no está verificada. Vas a poder registrar difusiones cuando el equipo valide tu comunidad.
          </p>
        </Card>
      )}

      <div className="mb-5 flex gap-2">
        <Chip active>Todas</Chip>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="No hay pasantías para difundir"
          description="Cuando las empresas publiquen nuevas oportunidades aparecerán acá."
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((i) => {
            const done = diffusedIds.has(i.id);
            const forMe = broadcastIds.has(i.id);
            return (
              <Card key={i.id} hover className="flex flex-col">
                {i.image_url && (
                  <div className="-mx-3 -mt-3 mb-3 h-28 overflow-hidden rounded-t-2xl sm:-mx-5 sm:-mt-5 sm:h-36">
                    <img src={i.image_url} alt={i.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="mb-2 flex items-center justify-between gap-2 text-sm text-white/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{i.company_name || i.company?.company_name || 'Empresa'}</span>
                  </div>
                  {forMe && (
                    <span className="shrink-0 rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-0.5 text-[11px] font-medium text-violet-200">
                      Te la enviaron
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold leading-snug text-white sm:text-lg">{i.title}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs sm:mt-3 sm:gap-2">
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
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-white/60 sm:mt-3 sm:line-clamp-3">{i.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5">
                  {/* Difundir: solo en pasantías de OTROS, no en las propias */}
                  {!ownIds.has(i.id) &&
                    (done ? (
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
                    ))}
                  {ownIds.has(i.id) && (
                    <button
                      onClick={() => deleteOwnInternship(i.id)}
                      className="ml-auto rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-red-300"
                      title="Eliminar pasantía"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {ownIds.has(i.id) && (
                  <div className="mt-2 inline-block rounded-full border border-brand-300/30 bg-brand-400/15 px-3 py-1 text-[11px] font-medium text-brand-200">
                    Tu pasantía
                  </div>
                )}
                <PostInteractions targetType="internship" targetId={i.id} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ active, children }: {
  active: boolean; children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
        active ? 'border-white bg-white text-brand-600' : 'border-white/15 bg-white/5 text-white/70'
      }`}
    >
      {children}
    </span>
  );
}
