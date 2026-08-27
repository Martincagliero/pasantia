import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export function ProfileShareButton({
  userId,
  name,
  className = '',
}: {
  userId: string;
  name: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copiá este enlace:', url);
    }
  }

  async function shareProfile() {
    const url = `${window.location.origin}/app/explorar?u=${encodeURIComponent(userId)}`;
    if (!navigator.share) {
      await copyLink(url);
      return;
    }

    try {
      await navigator.share({
        title: `${name} en PasantIA`,
        text: `Mirá el perfil de ${name} en PasantIA.`,
        url,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copyLink(url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void shareProfile()}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 ${className}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Enlace copiado' : 'Compartir perfil'}
    </button>
  );
}