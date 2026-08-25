// Encabezado de perfil (modo vista, estilo LinkedIn): avatar, nombre, verificación y editar.
import { BadgeCheck, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VerifiedBadge } from '../ambassador/VerifiedBadge';

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function ProfileHeader({
  name,
  subtitle,
  avatarUrl,
  verified,
  hasPro,
  onEdit,
}: {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  verified: boolean;
  hasPro: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-20 w-20 shrink-0 rounded-full border border-white/12 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-xl font-bold text-white">
            {initials(name)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{name}</h1>
            {verified && <VerifiedBadge verified />}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!verified && !hasPro && (
          <Link
            to="/app/planes"
            className="inline-flex items-center gap-1.5 px-1 py-2 text-xs font-medium text-brand-500 transition hover:text-brand-600"
          >
            <BadgeCheck className="h-4 w-4" strokeWidth={2.25} /> Verificación con Pro
          </Link>
        )}
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-brand-400"
        >
          <Pencil className="h-4 w-4" /> Editar perfil
        </button>
      </div>
    </div>
  );
}
