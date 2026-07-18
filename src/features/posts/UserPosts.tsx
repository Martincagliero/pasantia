// Lista las publicaciones de Novedades de un usuario (para su propio perfil o el de otros).
import { useEffect, useState } from 'react';
import { Link2, Newspaper } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Post, PostCategory } from '../../lib/database.types';
import { Card } from '../ui/primitives';

const CATEGORY_LABEL: Record<PostCategory, string> = {
  novedad: 'Novedad',
  proyecto: 'Proyecto',
  busqueda: 'Búsqueda',
  recurso: 'Recurso',
};

function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function UserPosts({
  authorId,
  title = 'Publicaciones en Novedades',
  emptyText = 'Todavía no publicó nada en Novedades.',
}: {
  authorId: string;
  title?: string;
  emptyText?: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('posts')
          .select('id, author_id, author_name, author_role, title, body, category, link_url, created_at')
          .eq('author_id', authorId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (active) setPosts((data as Post[]) ?? []);
      } catch {
        if (active) setPosts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorId]);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-white/50" />
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>

      {loading ? (
        <p className="text-sm text-white/45">Cargando…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-white/50">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const url = safeHref(p.link_url);
            return (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                    {CATEGORY_LABEL[p.category] ?? 'Novedad'}
                  </span>
                  <span className="ml-auto text-xs text-white/40">{formatDate(p.created_at)}</span>
                </div>
                <h4 className="font-medium text-white">{p.title}</h4>
                {p.body && <p className="mt-1 line-clamp-3 text-sm text-white/65">{p.body}</p>}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-300 hover:underline"
                  >
                    <Link2 className="h-3.5 w-3.5" /> Ver link
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
