// Badge de "verificado" para embajadores.
import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  verified: boolean;
  small?: boolean;
}

export function VerifiedBadge({ verified, small = false }: VerifiedBadgeProps) {
  if (verified) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-brand-300/30 bg-brand-500/15 font-medium text-brand-200 ${
        small ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
      }`}>
        <BadgeCheck className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        {!small && 'Verificado'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/15 font-medium text-amber-200 ${
      small ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
    }`}>
      {!small && 'Pendiente de verificación'}
    </span>
  );
}
