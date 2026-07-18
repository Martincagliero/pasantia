// Estudiante: explora las pasantías activas y se postula.
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Building2, Search, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { InternshipWithCompany, Modality } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageLoader } from '../ui/primitives';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default function BrowseInternships() {
  const { session, profile } = useAuth();
  const [internships, setInternships] = useState<InternshipWithCompany[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('todas');
  const [modalityFilter, setModalityFilter] = useState<'todas' | Modality>('todas');
  const [selected, setSelected] = useState<InternshipWithCompany | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: list }, { data: apps }, { data: saved }] = await Promise.all([
        supabase
          .from('internships')
          .select('*, company:company_profiles(company_name, industry)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('applications').select('internship_id').eq('student_id', session!.user.id),
        supabase.from('saved_internships').select('internship_id').eq('student_id', session!.user.id),
      ]);
      if (!active) return;
      setInternships((list as InternshipWithCompany[]) ?? []);
      setAppliedIds(new Set((apps ?? []).map((a) => a.internship_id)));
      setSavedIds(new Set((saved ?? []).map((s) => s.internship_id)));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  const areas = useMemo(() => {
    const set = new Set(internships.map((i) => i.area).filter(Boolean));
    return Array.from(set).sort();
  }, [internships]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return internships.filter((i) => {
      const matchesQuery =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.area.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.requirements ?? '').toLowerCase().includes(q) ||
        (i.company?.company_name ?? '').toLowerCase().includes(q);
      const matchesArea = areaFilter === 'todas' || i.area === areaFilter;
      const matchesModality = modalityFilter === 'todas' || i.modality === modalityFilter;
      return matchesQuery && matchesArea && matchesModality;
    });
  }, [internships, query, areaFilter, modalityFilter]);

  function markApplied(id: string) {
    setAppliedIds((prev) => new Set(prev).add(id));
  }

  async function toggleSave(id: string) {
    const isSaved = savedIds.has(id);
    // Optimista
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    if (isSaved) {
      await supabase
        .from('saved_internships')
        .delete()
        .eq('student_id', session!.user.id)
        .eq('internship_id', id);
    } else {
      await supabase
        .from('saved_internships')
        .insert({ student_id: session!.user.id, internship_id: id });
    }
  }

  if (loading) return <PageLoader />;

  const firstName = (profile?.full_name || 'estudiante').split(' ')[0];

  return (
    <div>
      <div className="mb-7">
        <p className="text-sm text-white/55">Hola, {firstName}</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Buscar pasantías
        </h1>
        <p className="mt-1.5 text-[15px] text-white/60">
          Explorá las oportunidades activas y postulate en un clic.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, proyecto, área o empresa"
            className="pl-12"
          />
        </div>
        <SelectField
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="sm:w-48"
        >
          <option value="todas">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </SelectField>
        <SelectField
          value={modalityFilter}
          onChange={(e) => setModalityFilter(e.target.value as 'todas' | Modality)}
          className="sm:w-40"
        >
          <option value="todas">Toda modalidad</option>
          <option value="presencial">Presencial</option>
          <option value="remoto">Remoto</option>
          <option value="hibrido">Híbrido</option>
        </SelectField>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No hay pasantías por ahora"
          description="Volvé pronto: las empresas publican nuevas oportunidades seguido."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((i) => {
            const applied = appliedIds.has(i.id);
            const saved = savedIds.has(i.id);
            return (
              <Card key={i.id} className="flex flex-col">
                <div className="mb-3 flex items-center justify-between gap-2 text-sm text-white/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{i.company?.company_name || 'Empresa'}</span>
                  </div>
                  <button
                    onClick={() => toggleSave(i.id)}
                    className={`shrink-0 rounded-lg p-1.5 transition hover:bg-white/10 ${
                      saved ? 'text-red-300' : 'text-white/40 hover:text-white'
                    }`}
                    title={saved ? 'Quitar de guardadas' : 'Guardar'}
                    aria-label={saved ? 'Quitar de guardadas' : 'Guardar'}
                  >
                    <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <h3 className="text-lg font-semibold leading-snug text-white">{i.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
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
                <p className="mt-3 line-clamp-3 text-sm text-white/60">{i.description}</p>
                <div className="mt-5 flex items-center gap-2">
                  {applied ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-200">
                      Ya postulaste
                    </span>
                  ) : (
                    <Button
                      as="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelected(i)}
                    >
                      Postularme
                    </Button>
                  )}
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
            markApplied(selected.id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

export function ApplyModal({
  internship,
  studentId,
  onClose,
  onApplied,
}: {
  internship: InternshipWithCompany;
  studentId: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('applications').insert({
      internship_id: internship.id,
      student_id: studentId,
      message: message.trim() || null,
    });
    setLoading(false);
    if (error) {
      setError(
        error.code === '23505'
          ? 'Ya te postulaste a esta pasantía.'
          : 'No se pudo enviar la postulación. Intentá de nuevo.'
      );
      return;
    }
    onApplied();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-lg rounded-4xl border border-white/12 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white/60">{internship.company?.company_name || 'Empresa'}</p>
        <h2 className="mt-1 text-xl font-bold text-white">{internship.title}</h2>
        <p className="mt-3 text-sm text-white/70">{internship.description}</p>
        {internship.requirements && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-white/80">Requisitos</p>
            <p className="mt-1 text-sm text-white/60">{internship.requirements}</p>
          </div>
        )}

        <div className="mt-6">
          <FormRow label="Mensaje para la empresa (opcional)" htmlFor="msg">
            <TextArea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contá por qué te interesa esta pasantía…"
            />
          </FormRow>
        </div>

        {error && (
          <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button as="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button as="button" variant="secondary" size="sm" onClick={handleApply} disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar postulación'}
          </Button>
        </div>
      </div>
    </div>
  );
}
