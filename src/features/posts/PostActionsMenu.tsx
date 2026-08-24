import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleAlert, Copy, Ellipsis, Search, Share2, Trash2, UserPlus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Post } from '../../lib/database.types';
import { ReportButton } from '../ui/ReportButton';
import { useModalGuard } from '../ui/modalGuard';
import { useMessages, type SuggestedContact } from '../messages/MessagesProvider';

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <path d="M12.04 2a9.84 9.84 0 0 0-8.42 14.92L2 22l5.24-1.58A9.93 9.93 0 1 0 12.04 2Zm0 17.86a8 8 0 0 1-4.08-1.12l-.3-.18-3.1.94.96-3.02-.2-.31a7.86 7.86 0 1 1 6.72 3.69Zm4.31-5.89c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.61.77-.75.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18a7.2 7.2 0 0 1-1.32-1.64c-.14-.24-.01-.37.1-.49.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.4-.58 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <path d="M5.34 3.5A2.34 2.34 0 1 1 5.34 8.18a2.34 2.34 0 0 1 0-4.68ZM3.31 9.75h4.06V22H3.31V9.75Zm6.64 0h3.89v1.67h.06c.54-1.03 1.87-2.12 3.85-2.12 4.11 0 4.87 2.71 4.87 6.23V22h-4.05v-5.74c0-1.37-.03-3.13-1.91-3.13-1.91 0-2.2 1.49-2.2 3.03V22H9.95V9.75Z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export type ShareablePost = Pick<Post, 'id' | 'author_id' | 'author_name' | 'title' | 'body'>;

interface PostActionsMenuProps {
  post: ShareablePost;
  currentUserId?: string;
  onDeleted?: (postId: string) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function PostShareSheet({ post, onClose }: { post: ShareablePost; onClose: () => void }) {
  const { shareContacts, shareContactsLoading, loadShareContacts, shareWith, connectForSharing } = useMessages();
  const [query, setQuery] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shareUrl = `${window.location.origin}/app/publicacion/${post.id}`;
  const shareText = post.title || post.body.slice(0, 160) || `Publicación de ${post.author_name}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedShare = encodeURIComponent(`${shareText}\n${shareUrl}`);
  useModalGuard(true);

  useEffect(() => {
    loadShareContacts();
  }, [loadShareContacts]);

  const contacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return shareContacts.filter((contact) => !normalized || contact.name.toLowerCase().includes(normalized));
  }, [query, shareContacts]);
  const connectionTarget = shareContacts.find((contact) => contact.id === connectionTargetId) ?? null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copiá este enlace:', shareUrl);
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title: 'PasantIA', text: shareText, url: shareUrl });
      onClose();
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      await copyLink();
    }
  }

  async function sendToPasantia(contact: SuggestedContact) {
    if (sendingId || sentIds.has(contact.id)) return;
    if (!contact.canMessage) {
      setConnectionTargetId(contact.id);
      setError(null);
      return;
    }
    setConnectionTargetId(null);
    setSendingId(contact.id);
    setError(null);
    const sendError = await shareWith(contact.id, `${shareText}\n${shareUrl}`);
    setSendingId(null);
    if (sendError) {
      setError(sendError);
      return;
    }
    setSentIds((current) => new Set(current).add(contact.id));
  }

  async function connectAndContinue(contact: SuggestedContact) {
    if (connectingId || contact.connectionState === 'sent' || contact.connectionState === 'unavailable') return;
    setConnectingId(contact.id);
    setError(null);
    const connectionError = await connectForSharing(contact.id, contact.connectionState);
    setConnectingId(null);
    if (connectionError) {
      setError(connectionError);
      return;
    }
    if (contact.connectionState === 'received') {
      const sendError = await shareWith(contact.id, `${shareText}\n${shareUrl}`);
      if (sendError) {
        setError(sendError);
        return;
      }
      setSentIds((current) => new Set(current).add(contact.id));
      setConnectionTargetId(null);
    }
  }

  const actionClass = 'group flex min-w-0 flex-col items-center gap-2 text-[11px] font-medium !text-white/75';
  const iconClass = 'flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] !text-white transition group-hover:bg-white/15';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#202124] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full !text-white/80 transition hover:bg-white/10" aria-label="Cerrar">
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-sm font-semibold !text-white">Compartir</h2>
          <span className="h-9 w-9" aria-hidden />
        </div>

        <label className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 !text-white/45" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en PasantIA"
            className="min-w-0 flex-1 bg-transparent text-sm !text-white placeholder:!text-white/40 outline-none"
          />
        </label>

        <div className="mt-4 min-h-[5.5rem]">
          {shareContactsLoading ? (
            <p className="py-7 text-center text-xs !text-white/45">Cargando contactos…</p>
          ) : contacts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {contacts.map((contact) => {
                const sent = sentIds.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => void sendToPasantia(contact)}
                    disabled={sendingId === contact.id || sent}
                    className="group w-16 shrink-0 text-center disabled:opacity-80"
                    title={`Enviar a ${contact.name}`}
                  >
                    <span className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-sm font-semibold !text-white">
                      {contact.avatar ? <img src={contact.avatar} alt="" className="h-full w-full object-cover" /> : initials(contact.name)}
                      {sent && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Check className="h-6 w-6 !text-white" /></span>}
                    </span>
                    <span className="mt-1.5 block truncate text-[11px] !text-white/75">{sent ? 'Enviado' : contact.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-xs leading-relaxed !text-white/45">
              Podés enviar a conversaciones existentes y conexiones habilitadas por tu plan.
            </p>
          )}
        </div>

        {connectionTarget && !connectionTarget.canMessage && (
          <div className="mt-1 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3">
            <div className="flex items-start gap-2.5">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed !text-white/80">
                  {connectionTarget.connectionState === 'received'
                    ? `${connectionTarget.name} quiere conectar con vos. Aceptá para compartirle la publicación.`
                    : connectionTarget.connectionState === 'sent'
                      ? `Tu solicitud a ${connectionTarget.name} está pendiente. Podrás compartir cuando la acepte.`
                      : connectionTarget.connectionState === 'none'
                        ? `Todavía no conectaste con ${connectionTarget.name}. En el plan Gratis, primero tiene que aceptar tu solicitud.`
                        : 'Tu plan Gratis no permite iniciar esta conversación. Necesitás una conversación previa o un plan superior.'}
                </p>
                {connectionTarget.connectionState !== 'unavailable' && (
                  <button
                    type="button"
                    onClick={() => void connectAndContinue(connectionTarget)}
                    disabled={connectingId === connectionTarget.id || connectionTarget.connectionState === 'sent'}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#202124] transition hover:bg-white/90 disabled:cursor-default disabled:opacity-55"
                  >
                    {connectionTarget.connectionState === 'sent' ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {connectingId === connectionTarget.id
                      ? 'Procesando…'
                      : connectionTarget.connectionState === 'received'
                        ? 'Aceptar y enviar'
                        : connectionTarget.connectionState === 'sent'
                          ? 'Solicitud enviada'
                          : 'Conectar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-1 text-center text-xs text-red-300">{error}</p>}

        <div className="mt-3 grid grid-cols-5 gap-2 border-t border-white/10 pt-4">
          <button type="button" onClick={() => void copyLink()} className={actionClass}>
            <span className={iconClass}>{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</span>
            <span className="truncate">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <a href={`https://wa.me/?text=${encodedShare}`} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp" className={actionClass}>
            <span className={iconClass}><WhatsAppLogo /></span><span className="truncate">WhatsApp</span>
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Compartir en LinkedIn" className={actionClass}>
            <span className={iconClass}><LinkedInLogo /></span><span className="truncate">LinkedIn</span>
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Compartir en Facebook" className={actionClass}>
            <span className={iconClass}><FacebookLogo /></span><span className="truncate">Facebook</span>
          </a>
          <button type="button" onClick={() => void nativeShare()} className={actionClass} aria-label="Más opciones para compartir">
            <span className={iconClass}><Share2 className="h-5 w-5" /></span><span className="truncate">Más</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PostActionsMenu({ post, currentUserId, onDeleted }: PostActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUserId === post.author_id;

  useEffect(() => {
    if (!open) return;
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [open]);

  async function deletePost() {
    if (!isOwner || deleting || !window.confirm('¿Querés borrar esta publicación?')) return;
    setDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('author_id', currentUserId);
    setDeleting(false);
    if (!error) onDeleted?.(post.id);
  }

  return (
    <div ref={menuRef} className="relative ml-auto shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
        aria-label="Opciones de la publicación"
        aria-expanded={open}
      >
        <Ellipsis className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSharing(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <Share2 className="h-4 w-4" /> Compartir
          </button>
          {!isOwner && (
            <ReportButton targetType="post" targetId={post.id} variant="menu" onOpen={() => setOpen(false)} />
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => void deletePost()}
              disabled={deleting}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> {deleting ? 'Borrando…' : 'Borrar'}
            </button>
          )}
        </div>
      )}

      {sharing && <PostShareSheet post={post} onClose={() => setSharing(false)} />}
    </div>
  );
}