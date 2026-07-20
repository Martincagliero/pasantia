// Novedades: panel compartido donde estudiantes y empresas publican
// novedades, proyectos, búsquedas y recursos. Todos los logueados las ven.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2, Building2, GraduationCap, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { Post, PostCategory } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { Card, EmptyState, PageHeader, PageLoader } from '../ui/primitives';
import { LinkPreview } from '../ui/LinkPreview';
import { PostInteractions } from '../ui/PostInteractions';

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

  async function handleDelete(id: string) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleCreated(post: PostWithAuthor) {
    setPosts((prev) => [post, ...prev]);
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
      <div className="mb-6 flex flex-wrap gap-2">
        {(['todas', ...CATEGORIES.map((c) => c.value)] as const).map((c) => {
          const active = filter === c;
          const label = c === 'todas' ? 'Todas' : categoryLabel[c as PostCategory];
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
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
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${categoryStyle[p.category]}`}
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

              <h3 className="text-lg font-semibold leading-snug text-white">{p.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-white/70">{p.body}</p>

              {p.link_url && <LinkPreview url={p.link_url} className="mt-3" />}

              <div className="mt-auto">
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
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
        <PostForm
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

function PostForm({
  authorId,
  authorName,
  authorRole,
  onClose,
  onCreated,
}: {
  authorId: string;
  authorName: string;
  authorRole: Post['author_role'];
  onClose: () => void;
  onCreated: (post: PostWithAuthor) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory>('novedad');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        author_name: authorName,
        author_role: authorRole,
        title: title.trim(),
        body: body.trim(),
        category,
        link_url: linkUrl.trim() || null,
      })
      .select('*')
      .single();
    setLoading(false);
    if (error || !data) {
      setError('No se pudo publicar. Verificá que la tabla "posts" exista (migración).');
      return;
    }
    onCreated(data as unknown as PostWithAuthor);
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
        <h2 className="text-xl font-bold text-white">Nueva publicación</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormRow label="Categoría" htmlFor="cat">
            <SelectField
              id="cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectField>
          </FormRow>

          <FormRow label="Título" htmlFor="title">
            <TextField
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Buscamos equipo para un proyecto de app"
            />
          </FormRow>

          <FormRow label="Contenido" htmlFor="body">
            <TextArea
              id="body"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contá los detalles…"
            />
          </FormRow>

          <FormRow label="Link (opcional)" htmlFor="link">
            <TextField
              id="link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
            />
          </FormRow>

          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button as="button" type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" size="sm" disabled={loading}>
              {loading ? 'Publicando…' : 'Publicar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
