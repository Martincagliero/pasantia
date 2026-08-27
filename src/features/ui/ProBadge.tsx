import { BadgeCheck } from 'lucide-react';

export function ProBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-brand-500 bg-brand-500 font-semibold uppercase !text-white ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'}`}>
      <BadgeCheck className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> Pro
    </span>
  );
}