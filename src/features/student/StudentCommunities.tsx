// Estudiante: sus comunidades. Crear, ver, compartir link.
import { useEffect, useState } from 'react';
import { Plus, Copy, Check, Trash2, Loader2, Users, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Community } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { TextField, TextArea } from '../ui/Field';
import { Link } from 'react-router-dom';

export default function StudentCommunities() {
  const { session } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [discover, setDiscover] = useState<Community[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_public: true });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const uid = session!.user.id;
        const [{ data: created }, { data: memberships }, { data: publicList }] = await Promise.all([
          supabase.from('communities').select('*').eq('creator_id', uid),
          supabase.from('community_members').select('community_id').eq('student_id', uid),
          supabase
            .from('communities')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false }),
        ]);

        let joined: Community[] = [];
        const joinedIds = (memberships ?? []).map((m) => m.community_id);
        if (joinedIds.length > 0) {
          const { data } = await supabase.from('communities').select('*').in('id', joinedIds);
          joined = (data as Community[]) ?? [];
        }

        // Merge (dedupe por id) y ordenar por fecha desc.
        const map = new Map<string, Community>();
        [...((created as Community[]) ?? []), ...joined].forEach((c) => map.set(c.id, c));
        const all = Array.from(map.values()).sort((a, b) =>
          (b.created_at ?? '').localeCompare(a.created_at ?? '')
        );
        if (active) setCommunities(all);

        // Descubrir: TODAS las públicas que no creaste ni te uniste.
        const mineIds = new Set(all.map((c) => c.id));
        const disc = ((publicList as Community[]) ?? []).filter(
          (c) => c.creator_id !== uid && !mineIds.has(c.id)
        );
        if (active) setDiscover(disc);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [session]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          creator_id: session!.user.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          is_public: form.is_public,
        })
        .select('*')
        .single();
      if (error) throw error;
      setCommunities((prev) => [data as Community, ...prev]);
      setForm({ name: '', description: '', is_public: true });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar comunidad?')) return;
    try {
      await supabase.from('communities').delete().eq('id', id);
      setCommunities((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  }

  async function copyLink(id: string) {
    const link = `${window.location.origin}/comunidad/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch { /* ignore */ }
  }

  async function handleJoin(c: Community) {
    setJoiningId(c.id);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: c.id, student_id: session!.user.id });
      if (error) throw error;
      setDiscover((prev) => prev.filter((x) => x.id !== c.id));
      setCommunities((prev) => [{ ...c, members_count: (c.members_count ?? 0) + 1 }, ...prev]);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '';
      if (/row-level security|policy/i.test(msg)) {
        alert('No podés unirte (puede que te hayan echado de esta comunidad).');
      } else {
        alert('No se pudo unir a la comunidad: ' + msg);
      }
    } finally {
      setJoiningId(null);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Mis comunidades"
        description="Crea comunidades de estudiantes y comparte el link con tus compañeros."
        action={
          <Button as="button" variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancelar' : 'Nueva comunidad'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 border-white/15">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Nombre de la comunidad
              </label>
              <TextField
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Pasantes UADE 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Descripción (opcional)
              </label>
              <TextArea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Sobre qué es tu comunidad..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="h-4 w-4 rounded border-white/30 bg-white/5"
              />
              <label htmlFor="is_public" className="text-sm text-white/70">
                Comunidad pública (empresas pueden ver y publicar pasantías)
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                as="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                as="button"
                variant="primary"
                size="sm"
                onClick={handleCreate}
                disabled={!form.name.trim() || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {communities.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Todavía no tienes comunidades"
          description="Crea tu primera comunidad y comparte el link con tus compañeros."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <Link key={c.id} to={`/app/comunidad/${c.id}`} className="group">
              <Card className="flex flex-col h-full transition group-hover:border-brand-300/50">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-white flex-1 sm:text-lg">{c.name}</h3>
                    <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-brand-300 transition shrink-0" />
                  </div>
                  {c.description && (
                    <p className="mt-1.5 text-sm text-white/65 line-clamp-2">{c.description}</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/50 border-t border-white/10 pt-3">
                  <Users className="h-3 w-3" />
                  <span>{c.members_count} {c.members_count === 1 ? 'miembro' : 'miembros'}</span>
                  {c.is_public && <span className="ml-auto text-emerald-300/70">Pública</span>}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      copyLink(c.id);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                  >
                    {copied === c.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar link
                      </>
                    )}
                  </button>
                  {c.creator_id === session!.user.id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(c.id);
                      }}
                      className="rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Descubrir: todas las comunidades públicas, cualquiera se puede unir */}
      {discover.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-1 text-base font-semibold text-white sm:text-lg">Descubrir comunidades</h2>
          <p className="mb-4 text-sm text-white/55">
            Comunidades públicas de la plataforma. Unite a la que quieras.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discover.map((c) => (
              <Card key={c.id} className="flex h-full flex-col">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white sm:text-lg">{c.name}</h3>
                  {c.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-white/65">{c.description}</p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs text-white/50">
                  <Users className="h-3 w-3" />
                  <span>{c.members_count} {c.members_count === 1 ? 'miembro' : 'miembros'}</span>
                  <span className="ml-auto text-emerald-300/70">Pública</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleJoin(c)}
                    disabled={joiningId === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-3 py-2 text-xs font-semibold !text-white transition hover:bg-brand-400 disabled:opacity-60"
                  >
                    {joiningId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Users className="h-3.5 w-3.5" />
                    )}
                    Unirme
                  </button>
                  <Link
                    to={`/app/comunidad/${c.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                  >
                    Ver
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
