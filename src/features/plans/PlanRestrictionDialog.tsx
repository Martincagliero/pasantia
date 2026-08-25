import { createPortal } from 'react-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlanRestriction } from '../../lib/planRestrictions';
import { useModalGuard } from '../ui/modalGuard';

export function PlanRestrictionDialog({
  restriction,
  onClose,
}: {
  restriction: PlanRestriction | null;
  onClose: () => void;
}) {
  useModalGuard(Boolean(restriction));
  if (!restriction) return null;

  return createPortal(
    <div className="dash-root fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:items-center sm:p-4" data-theme="light" onClick={onClose}>
      <div className="dash-panel relative w-full max-w-sm rounded-2xl border border-white/12 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-9 text-lg font-semibold text-white">{restriction.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{restriction.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/8 hover:text-white">
            Ahora no
          </button>
          <Link to="/app/planes" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-brand-400">
            {restriction.action} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}