// Estudiante: lista sus postulaciones con el estado de cada una.
import { useEffect, useState } from 'react';
import { Building2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { ApplicationWithInternship } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader, StatusBadge } from '../ui/primitives';

export default function MyApplications() {
  const { session } = useAuth();
  const [apps, setApps] = useState<ApplicationWithInternship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // internship por FK directa (confiable); la empresa se junta aparte (robusto).
      const { data } = await supabase
        .from('applications')
        .select('*, internship:internships(*)')
        .eq('student_id', session!.user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      const rows = (data as ApplicationWithInternship[]) ?? [];
      const companyIds = Array.from(
        new Set(rows.map((r) => r.internship?.company_id).filter((x): x is string => Boolean(x)))
      );
      if (companyIds.length > 0) {
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
        rows.forEach((r) => {
          if (r.internship) r.internship.company = cmap.get(r.internship.company_id) ?? null;
        });
      }
      if (!active) return;
      setApps(rows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  async function withdraw(id: string) {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (!error) setApps((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Mis postulaciones"
        description="Seguí el estado de cada pasantía a la que te postulaste."
      />

      {apps.length === 0 ? (
        <EmptyState
          title="Todavía no te postulaste"
          description="Explorá las pasantías activas y enviá tu primera postulación."
          action={
            <Button as="link" to="/app/pasantias" variant="secondary" size="sm">
              Buscar pasantías
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <Card key={a.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-sm text-white/60">
                  <Building2 className="h-4 w-4" strokeWidth={1.75} />
                  <span className="truncate">
                    {a.internship?.company?.company_name || 'Empresa'}
                  </span>
                </div>
                <h3 className="truncate text-lg font-semibold text-white">
                  {a.internship?.title || 'Pasantía'}
                </h3>
                <p className="mt-1 text-xs text-white/40">
                  Postulado el {new Date(a.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <button
                  onClick={() => withdraw(a.id)}
                  className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-red-300"
                  aria-label="Retirar postulación"
                  title="Retirar postulación"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
