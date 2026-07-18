// Encabezado de perfil (modo vista, estilo LinkedIn): avatar, nombre, verificación y editar.
import { Pencil, ShieldCheck, Clock } from 'lucide-react';
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
  requested,
  onEdit,
  onRequestVerification,
}: {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  verified: boolean;
  requested: boolean;
  onEdit: () => void;
  onRequestVerification: () => void;
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
          {!verified && requested && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
              <Clock className="h-3 w-3" /> Verificación en revisión
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!verified && !requested && (
          <button
            onClick={onRequestVerification}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <ShieldCheck className="h-4 w-4" /> Solicitar verificación
          </button>
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
