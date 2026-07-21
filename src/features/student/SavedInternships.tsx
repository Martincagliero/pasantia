// Estudiante: pasantías guardadas (favoritos).
import { useEffect, useState } from 'react';
import { MapPin, Building2, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { InternshipWithCompany, Modality } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { ApplyModal } from './BrowseInternships';
import { InternshipDetailModal } from '../ui/InternshipDetailModal';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default function SavedInternships() {
  const { session } = useAuth();
  const [items, setItems] = useState<InternshipWithCompany[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InternshipWithCompany | null>(null);
  const [detail, setDetail] = useState<InternshipWithCompany | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = session!.user.id;
      const [{ data: saved }, { data: apps }] = await Promise.all([
        supabase
          .from('saved_internships')
          .select('internship_id')
          .eq('student_id', uid)
          .order('created_at', { ascending: false }),
        supabase.from('applications').select('internship_id').eq('student_id', uid),
      ]);
      if (!active) return;

      const savedIds = (saved ?? []).map((s) => s.internship_id);
      let list: InternshipWithCompany[] = [];
      if (savedIds.length > 0) {
        // Sin embed: traemos las pasantías y juntamos la empresa aparte (robusto).
        const { data: ints } = await supabase.from('internships').select('*').in('id', savedIds);
        const items = (ints ?? []) as InternshipWithCompany[];
        const companyIds = Array.from(new Set(items.map((i) => i.company_id)));
        const { data: comps } = await supabase
          .from('company_profiles')
          .select('id, company_name, industry')
          .in('id', companyIds);
        const cmap = new Map(
          (comps as { id: string; company_name: string | null; industry: string | null }[] | null ?? []).map((c) => [
            c.id,
            { company_name: c.company_name, industry: c.industry },
          ])
        );
        const byId = new Map(items.map((i) => [i.id, { ...i, company: cmap.get(i.company_id) ?? null }]));
        // Respetar el orden en que se guardaron.
        list = savedIds
          .map((id) => byId.get(id))
          .filter((i): i is InternshipWithCompany => Boolean(i));
      }
      if (!active) return;
      setItems(list);
      setAppliedIds(new Set((apps ?? []).map((a) => a.internship_id)));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  async function unsave(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase
      .from('saved_internships')
      .delete()
      .eq('student_id', session!.user.id)
      .eq('internship_id', id);
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Guardadas"
        description="Las pasantías que marcaste para revisar más tarde."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No tenés pasantías guardadas"
          description="Tocá el corazón en cualquier pasantía para guardarla acá."
          action={
            <Button as="link" to="/app/pasantias" variant="secondary" size="sm">
              Buscar pasantías
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((i) => {
            const applied = appliedIds.has(i.id);
            return (
              <Card key={i.id} className="flex flex-col">
                <div className="mb-3 flex items-center justify-between gap-2 text-sm text-white/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{i.company?.company_name || 'Empresa'}</span>
                  </div>
                  <button
                    onClick={() => unsave(i.id)}
                    className="shrink-0 rounded-lg p-1.5 text-red-300 transition hover:bg-white/10"
                    title="Quitar de guardadas"
                  >
                    <Heart className="h-4 w-4" fill="currentColor" />
                  </button>
                </div>
                <h3
                  onClick={() => setDetail(i)}
                  className="cursor-pointer text-base font-semibold leading-snug text-white transition hover:text-white/80 sm:text-lg"
                >
                  {i.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs sm:mt-3 sm:gap-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                    {i.area}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                    {modalityLabel[i.modality]}
                  </span>
                  {i.location && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                      <MapPin className="h-3 w-3" /> {i.location}
                    </span>
                  )}
                </div>
                <p
                  onClick={() => setDetail(i)}
                  className="mt-3 line-clamp-3 cursor-pointer text-sm text-white/60"
                >
                  {i.description}
                </p>
                <div className="mt-5 flex items-center gap-2">
                  {applied ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-200">
                      Ya postulaste
                    </span>
                  ) : (
                    <Button as="button" size="sm" variant="secondary" onClick={() => setSelected(i)}>
                      Postularme
                    </Button>
                  )}
                  <button
                    onClick={() => setDetail(i)}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Ver detalle
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <ApplyModal
          internship={selected}
          studentId={session!.user.id}
          onClose={() => setSelected(null)}
          onApplied={() => {
            setAppliedIds((prev) => new Set(prev).add(selected.id));
            setSelected(null);
          }}
        />
      )}

      {detail && (
        <InternshipDetailModal
          internship={detail}
          onClose={() => setDetail(null)}
          actions={
            appliedIds.has(detail.id) ? (
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-200">
                Ya postulaste
              </span>
            ) : (
              <Button
                as="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelected(detail);
                  setDetail(null);
                }}
              >
                Postularme
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
