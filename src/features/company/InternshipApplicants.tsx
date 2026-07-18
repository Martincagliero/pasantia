// Empresa: ve los postulantes de una pasantía y cambia el estado de cada uno.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, GraduationCap, FileText, Link2, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ApplicationStatus, StudentProfile } from '../../lib/database.types';
import { Card, EmptyState, PageHeader, PageLoader, StatusBadge } from '../ui/primitives';
import { STATUS_META, STATUS_ORDER, normalizeStatus } from '../ui/applicationStatus';

interface ApplicantRow {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  student:
    | {
        id: string;
        full_name: string;
        email: string;
        student_profiles: StudentProfile | StudentProfile[] | null;
      }
    | null;
}

function studentDetails(s: ApplicantRow['student']): StudentProfile | null {
  if (!s?.student_profiles) return null;
  return Array.isArray(s.student_profiles) ? s.student_profiles[0] ?? null : s.student_profiles;
}

export default function InternshipApplicants() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: internship }, { data: apps }] = await Promise.all([
        supabase.from('internships').select('title').eq('id', id!).single(),
        supabase
          .from('applications')
          .select(
            '*, student:profiles(id, full_name, email, student_profiles(*))'
          )
          .eq('internship_id', id!)
          .order('created_at', { ascending: false }),
      ]);
      if (!active) return;
      setTitle((internship as { title: string } | null)?.title ?? 'Pasantía');
      setRows((apps as ApplicantRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function changeStatus(appId: string, status: ApplicationStatus) {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId);
    if (!error) {
      setRows((prev) => prev.map((r) => (r.id === appId ? { ...r, status } : r)));
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <Link
        to="/app/mis-pasantias"
        className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a mis pasantías
      </Link>

      <PageHeader
        title="Postulantes"
        description={title}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Sin postulantes todavía"
          description="Cuando alguien se postule a esta pasantía, vas a verlo acá."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const d = studentDetails(r.student);
            return (
              <Card key={r.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {r.student?.full_name || 'Estudiante'}
                      </h3>
                      <StatusBadge status={r.status} />
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/60">
                      {r.student?.email && (
                        <a
                          href={`mailto:${r.student.email}`}
                          className="inline-flex items-center gap-2 hover:text-white"
                        >
                          <Mail className="h-4 w-4" /> {r.student.email}
                        </a>
                      )}
                      {(d?.career || d?.university) && (
                        <span className="inline-flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {[d?.career, d?.university, d?.year].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {d?.cv_url && (
                        <a
                          href={d.cv_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 hover:text-white"
                        >
                          <FileText className="h-4 w-4" /> Ver CV
                        </a>
                      )}
                      {d?.linkedin_url && (
                        <a
                          href={d.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 hover:text-white"
                        >
                          <Link2 className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                      {d?.portfolio_url && (
                        <a
                          href={d.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 hover:text-white"
                        >
                          <Globe className="h-4 w-4" /> Portfolio
                        </a>
                      )}
                    </div>

                    {d?.skills && d.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {d.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {r.message && (
                      <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                        “{r.message}”
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <p className="mb-1.5 text-xs font-medium text-white/50">Cambiar estado</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_ORDER.map((s) => {
                        const activeS = normalizeStatus(r.status) === s;
                        return (
                          <button
                            key={s}
                            onClick={() => changeStatus(r.id, s)}
                            disabled={activeS}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              activeS
                                ? STATUS_META[s].active
                                : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {STATUS_META[s].emoji} {STATUS_META[s].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
