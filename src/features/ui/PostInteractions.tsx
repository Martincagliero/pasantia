// Reacciones con emojis + comentarios para publicaciones, proyectos y pasantías.
// Visible para todos los usuarios autenticados. Degrada si faltan las tablas.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Trash2, SmilePlus, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export type InteractionTarget = 'post' | 'community_post' | 'internship';

const EMOJIS = ['👍', '❤️', '🎉', '👏', '🔥'];

interface Comment {
  id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function timeAgo(d: string): string {
  try {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `hace ${days} d`;
    return new Date(d).toLocaleDateString('es-AR');
  } catch {
    return '';
  }
}

export function PostInteractions({
  targetType,
  targetId,
}: {
  targetType: InteractionTarget;
  targetId: string;
}) {
  const { session, profile } = useAuth();
  const uid = session?.user.id;
  const [reactions, setReactions] = useState<{ user_id: string; emoji: string }[]>([]);
  const [reactorsOpen, setReactorsOpen] = useState(false);
  const [reactorNames, setReactorNames] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [seen, setSeen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of reactions) c[r.emoji] = (c[r.emoji] ?? 0) + 1;
    return c;
  }, [reactions]);
  const myEmoji = useMemo(
    () => reactions.find((r) => r.user_id === uid)?.emoji ?? null,
    [reactions, uid]
  );

  const load = useCallback(async () => {
    try {
      const [{ data: reacts }, { data: cmts }] = await Promise.all([
        supabase
          .from('post_reactions')
          .select('emoji, user_id')
          .eq('target_type', targetType)
          .eq('target_id', targetId),
        supabase
          .from('post_comments')
          .select('id, user_id, author_name, content, created_at')
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .order('created_at', { ascending: true }),
      ]);
      setReactions((reacts as { emoji: string; user_id: string }[]) ?? []);
      setComments((cmts as Comment[]) ?? []);
    } catch {
      /* tablas no creadas: degradar */
    }
  }, [targetType, targetId]);

  // Carga diferida: solo cuando la tarjeta entra en pantalla (menos consultas al inicio).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  useEffect(() => {
    if (seen) load();
  }, [seen, load]);

  async function react(emoji: string) {
    if (!uid) return;
    setPickerOpen(false);
    const prev = myEmoji;
    // Optimista
    setReactions((rs) => {
      const without = rs.filter((r) => r.user_id !== uid);
      return prev === emoji ? without : [...without, { user_id: uid, emoji }];
    });
    try {
      if (prev === emoji) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('user_id', uid);
      } else {
        await supabase.from('post_reactions').upsert(
          { target_type: targetType, target_id: targetId, user_id: uid, emoji },
          { onConflict: 'target_type,target_id,user_id' }
        );
      }
    } catch (err: any) {
      if (/post_reactions|does not exist|relation|schema cache/i.test(err?.message ?? '')) {
        alert('Falta crear las tablas de reacciones/comentarios.\nEjecutá supabase/migracion-reacciones-comentarios.sql en Supabase.');
      }
      load();
    }
  }

  // Al tocar el resumen de reacciones: muestra quién reaccionó y con qué emoji.
  async function toggleReactors() {
    const next = !reactorsOpen;
    setReactorsOpen(next);
    if (!next) return;
    const ids = Array.from(new Set(reactions.map((r) => r.user_id))).filter(
      (id) => !(id in reactorNames)
    );
    if (ids.length === 0) return;
    try {
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      setReactorNames((prev) => {
        const map = { ...prev };
        for (const p of (data as { id: string; full_name: string | null }[] | null) ?? []) {
          map[p.id] = p.full_name || 'Usuario';
        }
        return map;
      });
    } catch {
      /* ignore */
    }
  }

  async function addComment() {
    if (!text.trim() || !uid) return;
    setSending(true);
    try {
      const { error } = await supabase.from('post_comments').insert({
        target_type: targetType,
        target_id: targetId,
        user_id: uid,
        author_name: profile?.full_name ?? null,
        content: text.trim(),
      });
      if (error) throw error;
      setText('');
      await load();
    } catch (err: any) {
      if (/post_comments|does not exist|relation|schema cache/i.test(err?.message ?? '')) {
        alert('Falta crear las tablas de reacciones/comentarios.\nEjecutá supabase/migracion-reacciones-comentarios.sql en Supabase.');
      }
    } finally {
      setSending(false);
    }
  }

  async function removeComment(id: string) {
    setComments((cs) => cs.filter((c) => c.id !== id));
    await supabase.from('post_comments').delete().eq('id', id);
  }

  const totalReactions = Object.values(counts).reduce((s, n) => s + n, 0);
  const activeEmojis = EMOJIS.filter((e) => (counts[e] ?? 0) > 0);

  return (
    <div ref={rootRef} className="mt-3 border-t border-white/10 pt-2.5">
      <div className="flex items-center gap-1">
        {/* Resumen de reacciones (se toca para ver quién reaccionó) */}
        {totalReactions > 0 ? (
          <div className="relative mr-auto">
            <button
              onClick={toggleReactors}
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
              title="Ver quién reaccionó"
            >
              <span className="flex">
                {activeEmojis.slice(0, 3).map((e) => (
                  <span key={e} className="text-sm leading-none">{e}</span>
                ))}
              </span>
              {totalReactions}
            </button>
            {reactorsOpen && (
              <div className="dash-panel absolute bottom-full left-0 z-20 mb-2 max-h-56 w-56 overflow-y-auto rounded-2xl border border-white/12 p-2 shadow-xl">
                <p className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Reacciones
                </p>
                {reactions.map((r, idx) => (
                  <div
                    key={r.user_id + idx}
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1.5"
                  >
                    <span className="text-base leading-none">{r.emoji}</span>
                    <span className="truncate text-[13px] text-white/80">
                      {reactorNames[r.user_id] ||
                        (r.user_id === uid ? profile?.full_name || 'Vos' : 'Usuario')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="mr-auto" />
        )}

        {/* Reaccionar */}
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition hover:bg-white/10 ${
              myEmoji ? 'text-brand-500' : 'text-white/60 hover:text-white'
            }`}
          >
            {myEmoji ? <span className="text-base leading-none">{myEmoji}</span> : <SmilePlus className="h-4 w-4" />}
            Reaccionar
          </button>
          {pickerOpen && (
            <div className="dash-panel absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border border-white/12 p-1.5 shadow-xl">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => react(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:scale-125 ${
                    myEmoji === e ? 'bg-brand-500/20' : 'hover:bg-white/10'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comentar: enfoca el campo (los comentarios ya están visibles) */}
        <button
          onClick={() => inputRef.current?.focus()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length > 0 ? comments.length : ''} Comentar
        </button>
      </div>

      <div className="mt-2.5 space-y-2.5">
        {comments.length > 2 && !showAllComments && (
          <button
            onClick={() => setShowAllComments(true)}
            className="text-xs font-medium text-white/50 transition hover:text-white"
          >
            Ver los {comments.length} comentarios
          </button>
        )}
        {(showAllComments ? comments : comments.slice(-2)).map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
              {initials(c.author_name || 'U')}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl bg-white/[0.05] px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-white">{c.author_name || 'Usuario'}</span>
                <span className="text-[11px] text-white/40">{timeAgo(c.created_at)}</span>
                {c.user_id === uid && (
                  <button
                    onClick={() => removeComment(c.id)}
                    className="ml-auto rounded p-1 text-white/35 transition hover:text-red-300"
                    title="Eliminar comentario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] text-white/80">{c.content}</p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addComment();
              }
            }}
            placeholder="Escribí un comentario…"
            className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-[13px] text-white placeholder:text-white/35 outline-none focus:border-brand-400/60"
          />
          <button
            onClick={addComment}
            disabled={sending || !text.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 !text-white transition hover:bg-brand-400 disabled:opacity-50"
            aria-label="Comentar"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
