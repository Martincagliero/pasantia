// Modal reutilizable para crear una publicación (Novedades / Inicio).
import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import type { Post, PostCategory } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField, TextArea, TextField } from '../ui/Field';
import { useModalGuard } from '../ui/modalGuard';
import { normalizeUrl } from '../../lib/url';
import { sendPushEvent } from '../../lib/notify';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'novedad', label: 'Novedad' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'busqueda', label: 'Búsqueda' },
  { value: 'recurso', label: 'Recurso' },
];

export function PostComposerModal({
  authorId,
  authorName,
  authorRole,
  showCategory = true,
  onClose,
  onCreated,
}: {
  authorId: string;
  authorName: string;
  authorRole: Post['author_role'];
  showCategory?: boolean;
  onClose: () => void;
  onCreated: (post: Post) => void;
}) {
  useModalGuard();
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
        link_url: normalizeUrl(linkUrl) || null,
      })
      .select('*')
      .single();
    setLoading(false);
    if (error || !data) {
      setError('No se pudo publicar. Verificá que la tabla "posts" exista (migración).');
      return;
    }
    void sendPushEvent('post', data.id);
    onCreated(data as unknown as Post);
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
          {showCategory && (
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
          )}

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
              type="text"
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
