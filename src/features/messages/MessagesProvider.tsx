// Mensajería directa estilo LinkedIn: panel desplegable abajo a la derecha.
// Provee un contexto para abrir un chat con alguien desde cualquier parte del panel.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MessageSquare, ChevronDown, ChevronUp, ArrowLeft, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

interface MessagesContextValue {
  openChatWith: (userId: string, name: string, avatar?: string | null) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function useMessages(): MessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages debe usarse dentro de <MessagesProvider>');
  return ctx;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  otherId: string;
  name: string;
  avatar: string | null;
  last: string;
  lastAt: string;
  unread: number;
}

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function ChatAvatar({
  url,
  name,
  className = 'h-9 w-9',
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
}) {
  return url ? (
    <img
      src={url}
      alt={name}
      className={`${className} shrink-0 rounded-full border border-white/12 object-cover`}
    />
  ) : (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white`}
    >
      {initials(name)}
    </span>
  );
}

function timeShort(d: string): string {
  try {
    return new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!uid) return;
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false })
        .limit(300);
      const msgs = (data as Message[]) ?? [];

      const map = new Map<string, Conversation>();
      for (const m of msgs) {
        const otherId = m.sender_id === uid ? m.recipient_id : m.sender_id;
        const isUnread = m.recipient_id === uid && !m.read;
        const existing = map.get(otherId);
        if (!existing) {
          map.set(otherId, {
            otherId,
            name: otherId,
            avatar: null,
            last: m.content,
            lastAt: m.created_at,
            unread: isUnread ? 1 : 0,
          });
        } else if (isUnread) {
          existing.unread += 1;
        }
      }

      const others = Array.from(map.keys());
      if (others.length > 0) {
        const [{ data: profs }, { data: st }, { data: co }, { data: am }] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', others),
          supabase.from('student_profiles').select('id, avatar_url').in('id', others),
          supabase.from('company_profiles').select('id, avatar_url').in('id', others),
          supabase.from('ambassador_profiles').select('id, logo_url').in('id', others),
        ]);
        for (const p of (profs as { id: string; full_name: string }[]) ?? []) {
          const c = map.get(p.id);
          if (c) c.name = p.full_name || 'Usuario';
        }
        const avatarById = new Map<string, string | null>();
        for (const r of (st as { id: string; avatar_url: string | null }[]) ?? [])
          if (r.avatar_url) avatarById.set(r.id, r.avatar_url);
        for (const r of (co as { id: string; avatar_url: string | null }[]) ?? [])
          if (r.avatar_url) avatarById.set(r.id, r.avatar_url);
        for (const r of (am as { id: string; logo_url: string | null }[]) ?? [])
          if (r.logo_url) avatarById.set(r.id, r.logo_url);
        for (const [id, url] of avatarById) {
          const c = map.get(id);
          if (c) c.avatar = url;
        }
      }
      setConvos(Array.from(map.values()));
    } catch {
      /* tabla no creada aún: dejar vacío */
    }
  }, [uid]);

  const loadThread = useCallback(
    async (otherId: string) => {
      if (!uid) return;
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`
          )
          .order('created_at', { ascending: true })
          .limit(300);
        setThread((data as Message[]) ?? []);
        // marcar como leídos los recibidos
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('recipient_id', uid)
          .eq('sender_id', otherId)
          .eq('read', false);
      } catch {
        setThread([]);
      }
    },
    [uid]
  );

  const openChatWith = useCallback(
    (userId: string, name: string, avatar: string | null = null) => {
      if (userId === uid) return;
      setActive({ id: userId, name, avatar });
      setOpen(true);
      loadThread(userId);
    },
    [uid, loadThread]
  );

  function goToProfile(userId: string) {
    navigate(`/app/explorar?u=${encodeURIComponent(userId)}`);
    setOpen(false);
  }

  async function handleSend() {
    if (!text.trim() || !active || !uid) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: uid,
        recipient_id: active.id,
        content: text.trim(),
      });
      if (error) throw error;
      setText('');
      await loadThread(active.id);
      loadConversations();
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (/messages|does not exist|relation|schema cache/i.test(msg)) {
        alert(
          'Falta crear la tabla de mensajes.\nEjecutá supabase/migracion-mensajes.sql en el SQL Editor de Supabase.'
        );
      } else {
        alert('No se pudo enviar el mensaje: ' + msg);
      }
    } finally {
      setSending(false);
    }
  }

  // Carga inicial + polling del badge de no leídos.
  useEffect(() => {
    if (!uid) return;
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, [uid, loadConversations]);

  // Polling del hilo abierto.
  useEffect(() => {
    if (!open || !active) return;
    const t = setInterval(() => loadThread(active.id), 5000);
    return () => clearInterval(t);
  }, [open, active, loadThread]);

  // Auto-scroll al final del hilo.
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [thread, active, open]);

  const unreadTotal = useMemo(() => convos.reduce((s, c) => s + c.unread, 0), [convos]);
  const value = useMemo(() => ({ openChatWith }), [openChatWith]);

  return (
    <MessagesContext.Provider value={value}>
      {children}

      {uid && (
        <div className="fixed bottom-16 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] lg:bottom-0">
          <div className="dash-panel overflow-hidden rounded-t-2xl border border-b-0 border-white/12 shadow-2xl shadow-black/40">
            {/* Header */}
            <button
              onClick={() => {
                setOpen((v) => !v);
                if (!open) loadConversations();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                <MessageSquare className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 text-sm font-semibold text-white">Mensajes</span>
              {unreadTotal > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold !text-white">
                  {unreadTotal}
                </span>
              )}
              {open ? (
                <ChevronDown className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronUp className="h-4 w-4 text-white/50" />
              )}
            </button>

            {open && (
              <div className="border-t border-white/10">
                {active ? (
                  /* ── Hilo ── */
                  <div className="flex h-[380px] flex-col">
                    <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                      <button
                        onClick={() => setActive(null)}
                        className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                        aria-label="Volver"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => goToProfile(active.id)}
                        className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/10"
                        title={`Ver perfil de ${active.name}`}
                      >
                        <ChatAvatar url={active.avatar} name={active.name} className="h-7 w-7" />
                        <span className="truncate text-sm font-semibold text-white">{active.name}</span>
                      </button>
                      <button
                        onClick={() => setActive(null)}
                        className="ml-auto rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
                        aria-label="Cerrar chat"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div ref={threadRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                      {thread.length === 0 ? (
                        <p className="mt-6 text-center text-xs text-white/45">
                          No hay mensajes todavía. ¡Escribí el primero!
                        </p>
                      ) : (
                        thread.map((m) => {
                          const mine = m.sender_id === uid;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                  mine
                                    ? 'bg-brand-500 !text-white'
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                <p
                                  className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-white/45'}`}
                                >
                                  {timeShort(m.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-white/10 p-2">
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Escribí un mensaje…"
                        className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-brand-400/60"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !text.trim()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 !text-white transition hover:bg-brand-400 disabled:opacity-50"
                        aria-label="Enviar"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Lista de conversaciones ── */
                  <div className="max-h-[380px] overflow-y-auto">
                    {convos.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-white/45">
                        Todavía no tenés conversaciones.<br />
                        Abrí un perfil en “Explorar” y tocá “Enviar mensaje”.
                      </p>
                    ) : (
                      convos.map((c) => (
                        <button
                          key={c.otherId}
                          onClick={() => openChatWith(c.otherId, c.name, c.avatar)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
                        >
                          <ChatAvatar url={c.avatar} name={c.name} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-white">{c.name}</span>
                              <span className="ml-auto shrink-0 text-[10px] text-white/40">
                                {timeShort(c.lastAt)}
                              </span>
                            </div>
                            <p className="truncate text-xs text-white/55">{c.last}</p>
                          </div>
                          {c.unread > 0 && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MessagesContext.Provider>
  );
}
