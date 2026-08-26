import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PostMention } from '../../lib/database.types';
import { normalizeUrl } from '../../lib/url';
import { EmojiText } from '../ui/EmojiText';

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/gi;
const EXACT_URL_PATTERN = /^(?:https?:\/\/|www\.)[^\s]+$/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SocialPostText({ text, mentions = [] }: { text: string; mentions?: PostMention[] }) {
  const activeMentions = mentions
    .filter((mention) => text.includes(`@${mention.name}`))
    .sort((left, right) => right.name.length - left.name.length);
  const mentionPattern = activeMentions.map((mention) => `@${escapeRegExp(mention.name)}`).join('|');
  const tokenPattern = new RegExp(`(${URL_PATTERN.source}${mentionPattern ? `|${mentionPattern}` : ''})`, 'gi');
  const mentionByLabel = new Map(activeMentions.map((mention) => [`@${mention.name}`.toLowerCase(), mention]));

  return (
    <>
      {text.split(tokenPattern).filter(Boolean).map((part, index) => {
        const mention = mentionByLabel.get(part.toLowerCase());
        if (mention) {
          const destination = mention.role === 'pasantia'
            ? `/app/buscar?q=${encodeURIComponent(mention.name)}`
            : `/app/explorar?u=${mention.id}`;
          return (
            <Link
              key={`${part}-${index}`}
              to={destination}
              className="font-semibold text-brand-400 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (EXACT_URL_PATTERN.test(part)) {
          return (
            <a
              key={`${part}-${index}`}
              href={normalizeUrl(part) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-400 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-300"
            >
              {part}
            </a>
          );
        }
        return <EmojiText key={`${index}-${part.slice(0, 8)}`} text={part} />;
      })}
    </>
  );
}

export function SocialPostImages({ urls = [] }: { urls?: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedIndex(null);
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((current) => current === null ? null : (current - 1 + urls.length) % urls.length);
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((current) => current === null ? null : (current + 1) % urls.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, urls.length]);

  if (urls.length === 0) return null;
  const visible = urls.slice(0, 4);

  return (
    <>
      <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${visible.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {visible.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`relative block w-full overflow-hidden bg-white/5 ${visible.length === 3 && index === 0 ? 'row-span-2' : ''}`}
            aria-label={`Ampliar imagen ${index + 1} de la publicación`}
          >
            <img
              src={url}
              alt={`Imagen ${index + 1} de la publicación`}
              loading="lazy"
              decoding="async"
              className={`w-full object-cover ${visible.length === 1 ? 'h-64 sm:h-80' : 'h-44 sm:h-56'}`}
            />
            {index === 3 && urls.length > 4 && (
              <span className="absolute inset-0 grid place-items-center bg-black/55 text-xl font-semibold text-white">
                +{urls.length - 4}
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-8"
          onClick={() => setSelectedIndex(null)}
          role="presentation"
        >
          <div
            className="relative flex max-h-[88dvh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl bg-[#17191d] shadow-2xl sm:w-auto sm:min-w-80"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen ${selectedIndex + 1} de ${urls.length}`}
          >
            <img
              src={urls[selectedIndex]}
              alt={`Imagen ${selectedIndex + 1} de la publicación`}
              className="max-h-[88dvh] max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/85"
              aria-label="Cerrar imagen"
            >
              <X className="h-5 w-5" />
            </button>
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((selectedIndex - 1 + urls.length) % urls.length)}
                  className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/85"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((selectedIndex + 1) % urls.length)}
                  className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/85"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <span className="absolute bottom-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
                  {selectedIndex + 1} / {urls.length}
                </span>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
