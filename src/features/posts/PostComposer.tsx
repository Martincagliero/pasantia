// Modal reutilizable para crear una publicación social (Novedades / Inicio).
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Link2, Loader2, Send, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Post, PostCategory, PostMention } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { FormRow, SelectField } from '../ui/Field';
import { useModalGuard } from '../ui/modalGuard';
import { normalizeUrl } from '../../lib/url';
import { sendPushEvent } from '../../lib/notify';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'novedad', label: 'Novedad' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'busqueda', label: 'Búsqueda' },
  { value: 'recurso', label: 'Recurso' },
];

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/i;

interface MentionCandidate extends PostMention {
  avatarUrl: string | null;
}

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
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory>('novedad');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mentions, setMentions] = useState<PostMention[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null);
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    if (mentionQuery === null) {
      setCandidates([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        let profilesQuery = supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['estudiante', 'empresa'])
          .neq('id', authorId)
          .order('full_name')
          .limit(8);
        if (mentionQuery.trim()) profilesQuery = profilesQuery.ilike('full_name', `%${mentionQuery.trim()}%`);
        const { data } = await profilesQuery;
        if (!active) return;
        const rows = (data ?? []) as { id: string; full_name: string; role: 'estudiante' | 'empresa' }[];
        const companyIds = rows.filter((row) => row.role === 'empresa').map((row) => row.id);
        const { data: companies } = companyIds.length
          ? await supabase.from('company_profiles').select('id, company_name, avatar_url').in('id', companyIds)
          : { data: [] };
        const companyById = new Map((companies ?? []).map((company) => [company.id, company]));
        const studentIds = rows.filter((row) => row.role === 'estudiante').map((row) => row.id);
        const { data: students } = studentIds.length
          ? await supabase.from('student_profiles').select('id, avatar_url').in('id', studentIds)
          : { data: [] };
        const studentAvatarById = new Map((students ?? []).map((student) => [student.id, student.avatar_url]));
        if (!active) return;
        setCandidates(rows.map((row) => ({
          id: row.id,
          role: row.role,
          name: row.role === 'empresa' ? companyById.get(row.id)?.company_name || row.full_name : row.full_name,
          avatarUrl: row.role === 'empresa' ? companyById.get(row.id)?.avatar_url ?? null : studentAvatarById.get(row.id) ?? null,
        })));
      })();
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [authorId, mentionQuery]);

  function updateMentionQuery(value: string, caret: number) {
    const beforeCaret = value.slice(0, caret);
    const start = beforeCaret.lastIndexOf('@');
    if (start < 0 || (start > 0 && !/\s/.test(beforeCaret[start - 1]))) {
      setMentionQuery(null);
      setMentionRange(null);
      return;
    }
    const query = beforeCaret.slice(start + 1);
    if (query.includes('\n') || query.length > 50) {
      setMentionQuery(null);
      setMentionRange(null);
      return;
    }
    setMentionQuery(query);
    setMentionRange({ start, end: caret });
  }

  function handleBodyChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setBody(value);
    updateMentionQuery(value, event.target.selectionStart ?? value.length);
  }

  function selectMention(candidate: MentionCandidate) {
    if (!mentionRange) return;
    const nextBody = `${body.slice(0, mentionRange.start)}@${candidate.name} ${body.slice(mentionRange.end)}`;
    setBody(nextBody);
    setMentions((current) => current.some((mention) => mention.id === candidate.id) ? current : [...current, candidate]);
    setMentionQuery(null);
    setMentionRange(null);
  }

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    setError(null);
    if (images.length + selected.length > MAX_IMAGES) {
      setError(`Podés cargar hasta ${MAX_IMAGES} imágenes por publicación.`);
      return;
    }
    const invalid = selected.find((file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setError('Cada archivo debe ser una imagen JPG, PNG, GIF o WEBP de hasta 5 MB.');
      return;
    }
    setImages((current) => [...current, ...selected]);
    setPreviews((current) => [...current, ...selected.map((file) => URL.createObjectURL(file))]);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
    setPreviews((current) => current.filter((_, imageIndex) => imageIndex !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() && images.length === 0) {
      setError('Escribí algo o agregá una imagen para publicar.');
      return;
    }
    setLoading(true);
    setError(null);
    const uploadedPaths: string[] = [];
    try {
      const imageUrls: string[] = [];
      for (const [index, image] of images.entries()) {
        const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${authorId}/posts/${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('cvs').upload(path, image);
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        imageUrls.push(supabase.storage.from('cvs').getPublicUrl(path).data.publicUrl);
      }
      const content = body.trim();
      const firstUrl = content.match(URL_PATTERN)?.[0] ?? null;
      const activeMentions = mentions.filter((mention) => content.includes(`@${mention.name}`));
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({
          author_id: authorId,
          author_name: authorName,
          author_role: authorRole,
          title: '',
          body: content,
          category,
          link_url: normalizeUrl(firstUrl ?? '') || null,
          image_urls: imageUrls,
          mentions: activeMentions,
        })
        .select('*')
        .single();
      if (insertError || !data) throw insertError ?? new Error('No se creó la publicación.');
      void sendPushEvent('post', data.id);
      onCreated(data as unknown as Post);
    } catch (submitError) {
      if (uploadedPaths.length > 0) void supabase.storage.from('cvs').remove(uploadedPaths);
      const message = submitError instanceof Error ? submitError.message : '';
      setError(/image_urls|mentions|schema cache|column/i.test(message)
        ? 'Falta ejecutar la migración "migracion-posts-social.sql" en Supabase.'
        : 'No se pudo publicar. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="glass max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/12 p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Crear publicación</h2>
            <p className="mt-0.5 text-xs text-white/45">Compartí una idea, un link, imágenes o mencioná a alguien.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
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

          <div className="relative">
            <textarea
              id="post-content"
              autoFocus
              value={body}
              onChange={handleBodyChange}
              onClick={(event) => updateMentionQuery(body, event.currentTarget.selectionStart ?? body.length)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setMentionQuery(null);
                  setMentionRange(null);
                }
              }}
              placeholder={`¿Qué querés compartir, ${authorName.split(' ')[0] || 'hoy'}?`}
              rows={7}
              className="w-full resize-none bg-transparent text-base leading-relaxed text-white outline-none placeholder:text-white/35 sm:text-lg"
            />
            {mentionQuery !== null && candidates.length > 0 && (
              <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-white/15 bg-brand-950 shadow-2xl">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => selectMention(candidate)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/8"
                  >
                    {candidate.avatarUrl ? (
                      <img src={candidate.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-bold text-white/70">{candidate.name.slice(0, 2).toUpperCase()}</span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{candidate.name}</span>
                      <span className="block text-xs capitalize text-white/45">{candidate.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {previews.map((preview, index) => (
                <div key={preview} className="relative overflow-hidden rounded-xl border border-white/10">
                  <img src={preview} alt={`Vista previa ${index + 1}`} className="h-36 w-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white" aria-label={`Quitar imagen ${index + 1}`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleImages} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES || loading}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/8 disabled:opacity-40"
            >
              <ImagePlus className="h-4 w-4" /> Imágenes {images.length > 0 && `${images.length}/${MAX_IMAGES}`}
            </button>
            {URL_PATTERN.test(body) && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/45"><Link2 className="h-3.5 w-3.5" /> Link detectado</span>
            )}
            <span className="ml-auto text-xs text-white/40">Escribí @ para mencionar</span>
          </div>

          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" variant="secondary" size="sm" disabled={loading || (!body.trim() && images.length === 0)}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando…</> : <><Send className="h-4 w-4" /> Publicar</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
