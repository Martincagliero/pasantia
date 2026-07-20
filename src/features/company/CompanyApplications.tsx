// Empresa: centro de candidatos. Buscador, contadores por estado, favoritos,
// estados de un clic, tarjetas modernas y vista de perfil con preview de CV.
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Star,
  Mail,
  GraduationCap,
  MapPin,
  FileText,
  Link2,
  Globe,
  Code2,
  X,
  Download,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { StudentProfile } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader, StatusBadge } from '../ui/primitives';
import { TextField, SelectField } from '../ui/Field';
import { STATUS_META, STATUS_ORDER, normalizeStatus, type AppStatus } from '../ui/applicationStatus';

interface Row {
  id: string;
  status: string;
  is_favorite: boolean;
  message: string | null;
  created_at: string;
  internship: { id: string; title: string } | null;
  student:
    | {
        full_name: string;
        email: string;
        student_profiles: StudentProfile | StudentProfile[] | null;
      }
    | null;
}

function details(s: Row['student']): StudentProfile | null {
  if (!s?.student_profiles) return null;
  return Array.isArray(s.student_profiles) ? s.student_profiles[0] ?? null : s.student_profiles;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '👤';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

type Filter = 'todas' | 'favoritos' | AppStatus;

export default function CompanyApplications() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todas');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('applications')
        .select(
          '*, internship:internships(id, title), student:profiles(full_name, email, student_profiles(*))'
        )
        .order('created_at', { ascending: false });
      if (!active) return;
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: rows.length, favoritos: 0 };
    STATUS_ORDER.forEach((s) => (c[s] = 0));
    rows.forEach((r) => {
      c[normalizeStatus(r.status)]++;
      if (r.is_favorite) c.favoritos++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const st = normalizeStatus(r.status);
      const matchesFilter =
        filter === 'todas' || (filter === 'favoritos' ? r.is_favorite : st === filter);
      if (!matchesFilter) return false;
      if (!q) return true;
      const d = details(r.student);
      const haystack = [
        r.student?.full_name,
        d?.career,
        d?.university,
        d?.area,
        (d?.skills ?? []).join(' '),
        r.internship?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, filter]);

  async function changeStatus(id: string, status: AppStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    await supabase.from('applications').update({ status }).eq('id', id);
  }

  async function toggleFavorite(id: string) {
    let value = false;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        value = !r.is_favorite;
        return { ...r, is_favorite: value };
      })
    );
    setSelected((s) => (s && s.id === id ? { ...s, is_favorite: !s.is_favorite } : s));
    await supabase.from('applications').update({ is_favorite: value }).eq('id', id);
  }

  if (loading) return <PageLoader />;

  const filterChips: { key: Filter; label: string; count: number }[] = [
    { key: 'todas', label: 'Todos', count: counts.todas },
    { key: 'favoritos', label: '⭐ Favoritos', count: counts.favoritos },
    ...STATUS_ORDER.map((s) => ({ key: s as Filter, label: STATUS_META[s].label, count: counts[s] })),
  ];

  return (
    <div>
      <PageHeader
        title="Candidatos"
        description="Gestioná las postulaciones: estados, favoritos y perfiles."
      />

      {/* Buscador */}
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, universidad, carrera o habilidad"
          className="pl-12"
        />
      </div>

      {/* Contadores / filtros */}
      <div className="mb-6">
        {/* En mobile: desplegable */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="mb-2 flex w-full items-center justify-between rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white sm:hidden"
        >
          <span>
            Filtro: {filterChips.find((c) => c.key === filter)?.label}{' '}
            <span className="text-white/50">({filterChips.find((c) => c.key === filter)?.count ?? 0})</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`flex-wrap gap-2 ${filtersOpen ? 'flex' : 'hidden'} sm:flex`}>
          {filterChips.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => {
                  setFilter(c.key);
                  setFiltersOpen(false);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'border-white bg-white text-brand-600'
                    : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {c.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active ? 'bg-brand-600/15 text-brand-700' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Sin candidatos"
          description={
            rows.length === 0
              ? 'Todavía no recibiste postulaciones. Publicá una pasantía para empezar.'
              : 'No hay candidatos con esos filtros.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const d = details(r.student);
            const st = normalizeStatus(r.status);
            return (
              <Card key={r.id} hover className="group flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">
                    {initials(r.student?.full_name || '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold text-white">
                        {r.student?.full_name || 'Estudiante'}
                      </h3>
                      <button
                        onClick={() => toggleFavorite(r.id)}
                        className={`shrink-0 rounded-lg p-1 transition hover:bg-white/10 ${
                          r.is_favorite ? 'text-amber-300' : 'text-white/30 hover:text-white'
                        }`}
                        title={r.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
                      >
                        <Star className="h-4 w-4" fill={r.is_favorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="truncate text-xs text-white/50">
                      {[d?.career, d?.university].filter(Boolean).join(' · ') || r.internship?.title}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <StatusBadge status={st} />
                </div>

                {d?.skills && d.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.skills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-white/40">Postuló a: {r.internship?.title || '—'}</p>

                {/* Estado (desplegable) */}
                <div className="mt-4">
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/45">Estado</label>
                  <SelectField
                    value={st}
                    onChange={(e) => changeStatus(r.id, e.target.value as AppStatus)}
                    className="h-9 py-0 text-sm"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].emoji} {STATUS_META[s].label}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex gap-3 text-white/50">
                    {d?.cv_url && (
                      <a href={d.cv_url} target="_blank" rel="noreferrer" title="CV" className="hover:text-white">
                        <FileText className="h-4 w-4" />
                      </a>
                    )}
                    {d?.linkedin_url && (
                      <a href={d.linkedin_url} target="_blank" rel="noreferrer" title="LinkedIn" className="hover:text-white">
                        <Link2 className="h-4 w-4" />
                      </a>
                    )}
                    {r.student?.email && (
                      <a href={`mailto:${r.student.email}`} title="Email" className="hover:text-white">
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setSelected(r)}
                    className="text-sm font-medium text-white/70 transition hover:text-white"
                  >
                    Ver perfil →
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <CandidateModal
          row={selected}
          onClose={() => setSelected(null)}
          onStatus={(s) => changeStatus(selected.id, s)}
          onFavorite={() => toggleFavorite(selected.id)}
        />
      )}
    </div>
  );
}

function CandidateModal({
  row,
  onClose,
  onStatus,
  onFavorite,
}: {
  row: Row;
  onClose: () => void;
  onStatus: (s: AppStatus) => void;
  onFavorite: () => void;
}) {
  const d = details(row.student);
  const st = normalizeStatus(row.status);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="glass max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-4xl border border-white/12 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-base font-bold text-white">
              {initials(row.student?.full_name || '')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{row.student?.full_name || 'Estudiante'}</h2>
              <p className="text-sm text-white/50">{[d?.career, d?.university].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onFavorite}
              className={`rounded-lg p-2 transition hover:bg-white/10 ${
                row.is_favorite ? 'text-amber-300' : 'text-white/40 hover:text-white'
              }`}
              title="Favorito"
            >
              <Star className="h-5 w-5" fill={row.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Datos rápidos */}
        <div className="mt-5 flex flex-col gap-2 text-sm text-white/70">
          {d?.location && (
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {d.location}</span>
          )}
          {d?.availability && <span>Disponibilidad: {d.availability}</span>}
          {d?.gpa && <span>Promedio: {d.gpa}</span>}
          {row.student?.email && (
            <a href={`mailto:${row.student.email}`} className="inline-flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4" /> {row.student.email}
            </a>
          )}
        </div>

        {d?.skills && d.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {d.skills.map((s) => (
              <span key={s} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                {s}
              </span>
            ))}
          </div>
        )}

        {d?.bio && <p className="mt-4 text-sm text-white/70">{d.bio}</p>}

        {row.message && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            “{row.message}”
          </p>
        )}

        {/* Links */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/60">
          {d?.linkedin_url && (
            <a href={d.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
              <Link2 className="h-4 w-4" /> LinkedIn
            </a>
          )}
          {d?.github_url && (
            <a href={d.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
              <Code2 className="h-4 w-4" /> GitHub
            </a>
          )}
          {d?.portfolio_url && (
            <a href={d.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
              <Globe className="h-4 w-4" /> Portfolio
            </a>
          )}
          {d?.transcript_url && (
            <a href={d.transcript_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
              <GraduationCap className="h-4 w-4" /> Analítico
            </a>
          )}
        </div>

        {/* Vista previa del CV */}
        {d?.cv_url && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-white/80">Vista previa del CV</p>
              <a
                href={d.cv_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
              >
                <Download className="h-4 w-4" /> Descargar
              </a>
            </div>
            <iframe
              src={d.cv_url}
              title="CV"
              className="h-80 w-full rounded-2xl border border-white/10 bg-white"
            />
          </div>
        )}

        {/* Cambiar estado */}
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
            Estado actual: <StatusBadge status={st} />
          </p>
          <SelectField value={st} onChange={(e) => onStatus(e.target.value as AppStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].emoji} {STATUS_META[s].label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
    </div>
  );
}
