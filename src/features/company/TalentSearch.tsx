// Empresa: buscador de talento. Muestra estudiantes que se hicieron visibles
// (perfil público) y permite filtrar por habilidad, área o nombre.
import { useEffect, useMemo, useState } from 'react';
import { Search, Mail, GraduationCap, MapPin, FileText, Link2, Globe, Code2, X, Phone, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { StudentProfile } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { SelectField, TextField } from '../ui/Field';
import { useModalGuard } from '../ui/modalGuard';

interface TalentRow extends StudentProfile {
  profile: { full_name: string; email: string } | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function Avatar({ url, name, className = '' }: { url?: string | null; name: string; className?: string }) {
  return url ? (
    <img src={url} alt={name} loading="lazy" className={`${className} shrink-0 rounded-2xl border border-white/12 object-cover`} />
  ) : (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-white/10 font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

export default function TalentSearch() {
  const [rows, setRows] = useState<TalentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('todas');
  const [selected, setSelected] = useState<TalentRow | null>(null);
  useModalGuard(!!selected);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('student_profiles')
        .select('*, profile:profiles(full_name, email)')
        .eq('is_public', true);
      if (!active) return;
      setRows((data as unknown as TalentRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const areas = useMemo(() => {
    const set = new Set(rows.map((r) => r.area).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesArea = areaFilter === 'todas' || r.area === areaFilter;
      if (!q) return matchesArea;
      const haystack = [
        r.profile?.full_name,
        r.career,
        r.university,
        r.area,
        (r.skills ?? []).join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesArea && haystack.includes(q);
    });
  }, [rows, query, areaFilter]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Buscar talento"
        description="Estudiantes con perfil público. Filtrá por habilidad, área o nombre."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por habilidad, carrera o nombre"
            className="pl-12"
          />
        </div>
        <SelectField value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="sm:w-52">
          <option value="todas">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </SelectField>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={
            rows.length === 0
              ? 'Todavía no hay estudiantes con perfil público. Aparecerán acá cuando activen la visibilidad.'
              : 'No hay estudiantes que coincidan con tu búsqueda.'
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Card className="h-full cursor-pointer hover:border-white/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Avatar
                      url={r.avatar_url}
                      name={r.profile?.full_name || 'Estudiante'}
                      className="h-11 w-11 text-sm"
                    />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">
                        {r.profile?.full_name || 'Estudiante'}
                      </h3>
                      {(r.career || r.university) && (
                        <p className="mt-0.5 text-sm text-white/55">
                          {[r.career, r.university, r.year].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  {r.area && (
                    <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {r.area}
                    </span>
                  )}
                </div>

                {r.skills && r.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.skills.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                        {s}
                      </span>
                    ))}
                    {r.skills.length > 5 && (
                      <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/40">
                        +{r.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {r.bio && (
                  <p className="mt-2.5 line-clamp-2 text-sm text-white/55">{r.bio}</p>
                )}

                <p className="mt-3 text-xs text-white/35">Clic para ver perfil completo →</p>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* ── Modal perfil completo ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="dash-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cerrar */}
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-5 flex items-start gap-4">
              <Avatar
                url={selected.avatar_url}
                name={selected.profile?.full_name || 'Estudiante'}
                className="h-14 w-14 text-lg"
              />
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-white">
                  {selected.profile?.full_name || 'Estudiante'}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/60">
                {(selected.career || selected.university) && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={15} />
                    {[selected.career, selected.university, selected.year].filter(Boolean).join(' · ')}
                  </span>
                )}
                {selected.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} /> {selected.location}
                  </span>
                )}
                {selected.availability && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={15} /> {selected.availability}
                  </span>
                )}
                </div>
              </div>
            </div>

            {/* Contactar */}
            <div className="mb-5 flex flex-wrap gap-3">
              {selected.profile?.email && (
                <a
                  href={`mailto:${selected.profile.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-950 hover:text-white"
                >
                  <Mail size={16} /> Enviar email
                </a>
              )}
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Phone size={16} /> {selected.phone}
                </a>
              )}
            </div>

            {/* Skills */}
            {selected.skills && selected.skills.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Habilidades</p>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map((s) => (
                    <span key={s} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white/80">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Área */}
            {selected.area && (
              <div className="mb-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">Área de interés</p>
                <p className="text-sm text-white/80">{selected.area}</p>
              </div>
            )}

            {/* Bio */}
            {selected.bio && (
              <div className="mb-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">Sobre el estudiante</p>
                <p className="text-sm leading-relaxed text-white/70">{selected.bio}</p>
              </div>
            )}

            {/* Links */}
            {(selected.cv_url || selected.transcript_url || selected.linkedin_url || selected.github_url || selected.portfolio_url) && (
              <div className="border-t border-white/10 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Links</p>
                <div className="flex flex-wrap gap-3">
                  {selected.cv_url && (
                    <a href={selected.cv_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                      <FileText size={15} /> CV
                    </a>
                  )}
                  {selected.transcript_url && (
                    <a href={selected.transcript_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                      <FileText size={15} /> Analítico
                    </a>
                  )}
                  {selected.linkedin_url && (
                    <a href={selected.linkedin_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                      <Link2 size={15} /> LinkedIn
                    </a>
                  )}
                  {selected.github_url && (
                    <a href={selected.github_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                      <Code2 size={15} /> GitHub
                    </a>
                  )}
                  {selected.portfolio_url && (
                    <a href={selected.portfolio_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                      <Globe size={15} /> Portfolio
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
