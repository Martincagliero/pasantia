import { useState } from 'react';
import type { PostMention } from '../../lib/database.types';
import { LinkPreview } from '../ui/LinkPreview';
import { SocialPostImages, SocialPostText } from './SocialPostContent';

export function ExpandablePostContent({
  body,
  mentions,
  imageUrls,
  linkUrl,
  className = '',
}: {
  body: string;
  mentions?: PostMention[];
  imageUrls?: string[];
  linkUrl?: string | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasHiddenContent = body.length > 100 || Boolean(imageUrls?.length) || Boolean(linkUrl);

  return (
    <div className={className}>
      {body && (
        <p className={`whitespace-pre-wrap break-words text-sm leading-5 text-white/65 ${!expanded && hasHiddenContent ? 'line-clamp-3 sm:line-clamp-none' : ''}`}>
          <SocialPostText text={body} mentions={mentions} />
        </p>
      )}

      <div className={`${expanded ? 'block' : 'hidden'} sm:block`}>
        <SocialPostImages urls={imageUrls} />
        {linkUrl && <LinkPreview url={linkUrl} className="mt-2.5 sm:mt-3" />}
      </div>

      {hasHiddenContent && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1.5 text-xs font-semibold text-brand-500 sm:hidden"
          aria-expanded={expanded}
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
}