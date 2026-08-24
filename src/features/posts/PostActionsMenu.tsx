import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Ellipsis, Share2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Post } from '../../lib/database.types';
import { ReportButton } from '../ui/ReportButton';
import { useModalGuard } from '../ui/modalGuard';

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

interface PostActionsMenuProps {
  post: Pick<Post, 'id' | 'author_id' | 'author_name' | 'title' | 'body'>;
  currentUserId?: string;
  onDeleted?: (postId: string) => void;
}

export function PostActionsMenu({ post, currentUserId, onDeleted }: PostActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUserId === post.author_id;
  const shareUrl = `${window.location.origin}/app/inicio?post=${post.id}`;
  const shareText = post.title || post.body.slice(0, 160) || `Publicación de ${post.author_name}`;
  useModalGuard(sharing);

  useEffect(() => {
    if (!open) return;
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [open]);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function deletePost() {
    if (!isOwner || deleting || !window.confirm('¿Querés borrar esta publicación?')) return;
    setDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('author_id', currentUserId);
    setDeleting(false);
    if (!error) onDeleted?.(post.id);
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

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

      {sharing && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setSharing(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#171a1f] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-base font-semibold text-white">Compartir publicación</h2>
            <p className="mt-1 line-clamp-2 text-sm text-white/50">{shareText}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp" className="flex min-w-0 flex-col items-center gap-2 rounded-lg bg-[#25D366] p-3 text-xs font-semibold !text-white transition hover:brightness-90">
                <WhatsAppLogo /> <span className="max-w-full truncate">WhatsApp</span>
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Compartir en LinkedIn" className="flex min-w-0 flex-col items-center gap-2 rounded-lg bg-[#0A66C2] p-3 text-xs font-semibold !text-white transition hover:brightness-90">
                <LinkedInLogo /> <span className="max-w-full truncate">LinkedIn</span>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Compartir en Facebook" className="flex min-w-0 flex-col items-center gap-2 rounded-lg bg-[#1877F2] p-3 text-xs font-semibold !text-white transition hover:brightness-90">
                <FacebookLogo /> <span className="max-w-full truncate">Facebook</span>
              </a>
            </div>
            <button type="button" onClick={() => void copyLink()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/6">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}