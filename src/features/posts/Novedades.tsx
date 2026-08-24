// Novedades: panel compartido donde estudiantes y empresas publican
// novedades, proyectos, búsquedas y recursos. Todos los logueados las ven.
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Building2, GraduationCap, Mail, ChevronDown } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Post, PostCategory } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { LinkPreview } from '../ui/LinkPreview';
import { PostInteractions } from '../ui/PostInteractions';
import { EmojiText } from '../ui/EmojiText';
import { PostComposerModal } from './PostComposer';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'novedad', label: 'Novedad' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'busqueda', label: 'Búsqueda' },
  { value: 'recurso', label: 'Recurso' },
];

const categoryStyle: Record<PostCategory, string> = {
  novedad: 'border-white/12 bg-white/5 text-white/70',
  proyecto: 'border-white/12 bg-white/5 text-white/70',
  busqueda: 'border-white/12 bg-white/5 text-white/70',
  recurso: 'border-white/12 bg-white/5 text-white/70',
};

const categoryLabel: Record<PostCategory, string> = {
  novedad: 'Novedad',
  proyecto: 'Proyecto',
  busqueda: 'Búsqueda',
  recurso: 'Recurso',
};

interface PostWithAuthor extends Post {
  author: { email: string } | null;
}

export default function Novedades() {
  const { session, profile } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'todas' | PostCategory>('todas');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles!author_id(email)')
        .order('created_at', { ascending: false });
      if (!active) return;
      setPosts((data as unknown as PostWithAuthor[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'todas' ? posts : posts.filter((p) => p.category === filter)),
    [posts, filter]
  );

  if (profile?.role === 'estudiante' && !profile.is_admin) {
    return <Navigate to="/app/inicio-estudiante" replace />;
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleCreated(post: Post) {
    setPosts((prev) => [{ ...post, author: null }, ...prev]);
    setShowForm(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Novedades"
        description="Compartí proyectos, búsquedas y recursos con la comunidad de PasantIA."
        action={
          <Button as="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Publicar
          </Button>
        }
      />

      {/* Filtros por categoría */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="mb-2 flex w-full items-center justify-between rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white sm:hidden"
        >
          <span>Categoría: {filter === 'todas' ? 'Todas' : categoryLabel[filter]}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`flex-wrap gap-2 ${filtersOpen ? 'flex' : 'hidden'} sm:flex`}>
          {(['todas', ...CATEGORIES.map((c) => c.value)] as const).map((c) => {
            const active = filter === c;
            const label = c === 'todas' ? 'Todas' : categoryLabel[c as PostCategory];
            return (
              <button
                key={c}
                onClick={() => {
                  setFilter(c);
                  setFiltersOpen(false);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'border-white bg-white text-brand-600'
                    : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Todavía no hay publicaciones"
          description="Sé el primero en compartir algo con la comunidad."
          action={
            <Button as="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
              Publicar
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium sm:px-3 sm:py-1 ${categoryStyle[p.category]}`}
                >
                  {categoryLabel[p.category]}
                </span>
                {p.author_id === session!.user.id && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-semibold leading-snug text-white sm:text-lg">{p.title}</h3>
              <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-sm text-white/70 sm:mt-2 sm:line-clamp-none"><EmojiText text={p.body} /></p>

              {p.link_url && <LinkPreview url={p.link_url} className="mt-2.5 sm:mt-3" />}

              <div className="mt-auto">
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 sm:mt-4 sm:gap-3 sm:pt-3">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    {p.author_role === 'empresa' ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <GraduationCap className="h-4 w-4" />
                    )}
                    <span className="font-medium text-white/70">{p.author_name || 'Usuario'}</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                  {p.author?.email && p.author_id !== session!.user.id && (
                    <a
                      href={`mailto:${p.author.email}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <Mail className="h-3.5 w-3.5" /> Contactar
                    </a>
                  )}
                </div>
                <PostInteractions targetType="post" targetId={p.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <PostComposerModal
          authorId={session!.user.id}
          authorName={profile?.full_name ?? ''}
          authorRole={profile?.role ?? 'estudiante'}
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
