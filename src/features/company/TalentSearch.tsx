// Empresa: buscador de talento. Muestra estudiantes que se hicieron visibles
// (perfil público) y permite filtrar por habilidad, área o nombre.
import { useEffect, useMemo, useState } from 'react';
import { Search, Mail, GraduationCap, MapPin, FileText, Link2, Globe, Code2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { StudentProfile } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { SelectField, TextField } from '../ui/Field';

interface TalentRow extends StudentProfile {
  profile: { full_name: string; email: string } | null;
}

export default function TalentSearch() {
  const [rows, setRows] = useState<TalentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('todas');

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
            <option key={a} value={a}>
              {a}
            </option>
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
            <Card key={r.id}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {r.profile?.full_name || 'Estudiante'}
                </h3>
                {r.gpa && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    Prom. {r.gpa}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/60">
                {(r.career || r.university) && (
                  <span className="inline-flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    {[r.career, r.university, r.year].filter(Boolean).join(' · ')}
                  </span>
                )}
                {r.location && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {r.location}
                  </span>
                )}
                {r.profile?.email && (
                  <a href={`mailto:${r.profile.email}`} className="inline-flex items-center gap-2 hover:text-white">
                    <Mail className="h-4 w-4" /> {r.profile.email}
                  </a>
                )}
              </div>

              {r.skills && r.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.skills.map((s) => (
                    <span key={s} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {r.bio && <p className="mt-3 text-sm text-white/60">{r.bio}</p>}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-sm text-white/60">
                {r.cv_url && (
                  <a href={r.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                    <FileText className="h-4 w-4" /> CV
                  </a>
                )}
                {r.transcript_url && (
                  <a href={r.transcript_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                    <FileText className="h-4 w-4" /> Analítico
                  </a>
                )}
                {r.linkedin_url && (
                  <a href={r.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                    <Link2 className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {r.github_url && (
                  <a href={r.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                    <Code2 className="h-4 w-4" /> GitHub
                  </a>
                )}
                {r.portfolio_url && (
                  <a href={r.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                    <Globe className="h-4 w-4" /> Portfolio
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
