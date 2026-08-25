// Distintivo compartido para todas las cuentas verificadas.
import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  verified: boolean;
  small?: boolean;
}

export function VerifiedBadge({ verified, small = false }: VerifiedBadgeProps) {
  if (!verified) return null;

  return (
    <BadgeCheck
      aria-label="Cuenta verificada"
      strokeWidth={2.25}
      className={`shrink-0 text-brand-500 ${small ? 'h-4 w-4' : 'h-5 w-5'}`}
    />
  );
}
