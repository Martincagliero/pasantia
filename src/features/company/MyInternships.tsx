// Empresa: lista sus pasantías, con acciones de activar/pausar, editar, ver postulantes.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Pencil, Trash2, Eye, EyeOff, Plus, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Internship, Modality } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import InternshipForm from './InternshipForm';
import { FREE_COMPANY_POSTS_PER_MONTH, isPro } from '../../lib/plans';
import { UpgradePrompt } from '../plans/UpgradePrompt';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

interface InternshipWithCount extends Internship {
  applications: { count: number }[];
}

export default function MyInternships() {
  const { session, profile } = useAuth();
  const [items, setItems] = useState<InternshipWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingFeatured, setPendingFeatured] = useState<Set<string>>(new Set());
  const [requestingFeatured, setRequestingFeatured] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data }, { data: requests }] = await Promise.all([
      supabase
        .from('internships')
        .select('*, applications(count)')
        .eq('company_id', session!.user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('plan_requests')
        .select('internship_id')
        .eq('user_id', session!.user.id)
        .eq('kind', 'featured')
        .eq('status', 'pending'),
    ]);
    setItems((data as InternshipWithCount[]) ?? []);
    setPendingFeatured(new Set((requests ?? []).map((request) => request.internship_id).filter(Boolean) as string[]));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  async function toggleActive(item: InternshipWithCount) {
    const { error } = await supabase
      .from('internships')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
      );
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta pasantía y sus postulaciones? Esta acción no se puede deshacer.'))
      return;
    const { error } = await supabase.from('internships').delete().eq('id', id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function requestFeatured(item: InternshipWithCount, days: 15 | 30) {
    setRequestingFeatured(item.id);
    const { error } = await supabase.from('plan_requests').insert({
      user_id: session!.user.id,
      requested_plan: null,
      kind: 'featured',
      internship_id: item.id,
      featured_days: days,
      message: `Destacar ${days} días`,
    });
    setRequestingFeatured(null);
    if (error) {
      alert(/plan_requests|schema cache|relation/i.test(error.message)
        ? 'Falta ejecutar la migración freemium en Supabase.'
        : 'No se pudo solicitar el destacado.');
      return;
    }
    setPendingFeatured((current) => new Set(current).add(item.id));
  }

  if (loading) return <PageLoader />;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlyPosts = items.filter((item) => new Date(item.created_at) >= monthStart).length;
  const unlimited = isPro(profile);
  const canPublish = unlimited || monthlyPosts < FREE_COMPANY_POSTS_PER_MONTH;

  return (
    <div>
      <PageHeader
        title="Mis pasantías"
        description="Gestioná tus publicaciones y revisá los postulantes."
        action={
          <Button as="button" variant="secondary" size="sm" onClick={openNew} disabled={!canPublish}>
            <Plus className="h-4 w-4" /> Publicar pasantía
          </Button>
        }
      />

      {!unlimited && (
        <Card className="mb-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-white">Plan Gratis</p>
              <p className="mt-1 text-sm text-white/55">Usaste {monthlyPosts} de {FREE_COMPANY_POSTS_PER_MONTH} publicaciones este mes.</p>
            </div>
            <Link to="/app/planes" className="text-sm font-semibold text-brand-500 hover:text-brand-400">Ver Empresa Pro</Link>
          </div>
        </Card>
      )}

      {!canPublish && <UpgradePrompt title="Publicaciones mensuales agotadas" description="Empresa Pro permite publicar pasantías sin límite y ver todos los postulados." compact />}

      {formOpen && (
        <InternshipForm
          asModal
          editId={editingId}
          onCancel={() => setFormOpen(false)}
          onDone={() => {
            setFormOpen(false);
            setLoading(true);
            load();
          }}
        />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Todavía no publicaste pasantías"
          description="Creá tu primera oferta y empezá a recibir postulaciones."
          action={
            <Button as="button" variant="secondary" size="sm" onClick={openNew} disabled={!canPublish}>
              <Plus className="h-4 w-4" /> Publicar pasantía
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((i) => {
            const count = i.applications?.[0]?.count ?? 0;
            return (
              <Card key={i.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{i.title}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        i.is_active
                          ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200'
                          : 'border-white/20 bg-white/10 text-white/60'
                      }`}
                    >
                      {i.is_active ? 'Activa' : 'Pausada'}
                    </span>
                    {i.featured_until && new Date(i.featured_until) > new Date() && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-300">
                        <Sparkles className="h-3 w-3" /> Destacada
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/60">
                    <span>{i.area}</span>
                    <span>·</span>
                    <span>{modalityLabel[i.modality]}</span>
                    {i.location && (
                      <>
                        <span>·</span>
                        <span>{i.location}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pendingFeatured.has(i.id) ? (
                    <span className="px-2 text-xs text-white/45">Destacado pendiente</span>
                  ) : (
                    <select
                      aria-label={`Destacar ${i.title}`}
                      defaultValue=""
                      disabled={requestingFeatured === i.id}
                      onChange={(event) => {
                        const days = Number(event.target.value) as 15 | 30;
                        if (days) void requestFeatured(i, days);
                        event.target.value = '';
                      }}
                      className="rounded-full border border-brand-400/25 bg-white/5 px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="" disabled>Destacar</option>
                      <option value="15">15 días</option>
                      <option value="30">30 días</option>
                    </select>
                  )}
                  <Link
                    to={`/app/pasantia/${i.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <Users className="h-4 w-4" /> {!unlimited && count === 3 ? '3+' : count} postulante{count === 1 ? '' : 's'}
                  </Link>
                  <button
                    onClick={() => toggleActive(i)}
                    className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title={i.is_active ? 'Pausar' : 'Activar'}
                  >
                    {i.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(i.id)}
                    className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(i.id)}
                    className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
