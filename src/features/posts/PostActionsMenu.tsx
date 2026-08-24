import { useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Check, Copy, Ellipsis, MessageCircle, Share2, Trash2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Post } from '../../lib/database.types';
import { ReportButton } from '../ui/ReportButton';
import { useModalGuard } from '../ui/modalGuard';

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
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-white/12 bg-[#171a1f] py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSharing(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/8 hover:text-white"
          >
            <Share2 className="h-4 w-4" /> Compartir
          </button>
          {!isOwner && <ReportButton targetType="post" targetId={post.id} variant="menu" />}
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
              <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3 text-xs text-white/70 transition hover:bg-white/6">
                <MessageCircle className="h-5 w-5 text-emerald-400" /> WhatsApp
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3 text-xs text-white/70 transition hover:bg-white/6">
                <BriefcaseBusiness className="h-5 w-5 text-sky-400" /> LinkedIn
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3 text-xs text-white/70 transition hover:bg-white/6">
                <Users className="h-5 w-5 text-blue-400" /> Facebook
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