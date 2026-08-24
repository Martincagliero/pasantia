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
          return (
            <Link
              key={`${part}-${index}`}
              to={`/app/explorar?u=${mention.id}`}
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
  if (urls.length === 0) return null;
  const visible = urls.slice(0, 4);

  return (
    <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${visible.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {visible.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative block overflow-hidden bg-white/5 ${visible.length === 3 && index === 0 ? 'row-span-2' : ''}`}
        >
          <img
            src={url}
            alt={`Imagen ${index + 1} de la publicación`}
            loading="lazy"
            decoding="async"
            className={`w-full object-cover ${visible.length === 1 ? 'max-h-[32rem]' : 'h-44 sm:h-56'}`}
          />
          {index === 3 && urls.length > 4 && (
            <span className="absolute inset-0 grid place-items-center bg-black/55 text-xl font-semibold text-white">
              +{urls.length - 4}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
