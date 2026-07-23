// Modal de detalle de una pasantía: foto entera, toda la info y comentarios.
import type { ReactNode } from 'react';
import { X, Building2, MapPin } from 'lucide-react';
import type { InternshipWithCompany, Modality } from '../../lib/database.types';
import { PostInteractions } from './PostInteractions';
import { useModalGuard } from './modalGuard';

const modalityLabel: Record<Modality, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export function InternshipDetailModal({
  internship: i,
  onClose,
  actions,
}: {
  internship: InternshipWithCompany;
  onClose: () => void;
  /** Acciones opcionales (postularme, difundir, etc.) */
  actions?: ReactNode;
}) {
  useModalGuard();
  const company = i.company_name || i.company?.company_name || 'Empresa';
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-3 py-6 sm:items-center sm:px-4 sm:py-8"
      onClick={onClose}
    >
      <div
        className="glass relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {i.image_url && (
          <div className="max-h-[45vh] w-full overflow-hidden bg-black/30">
            <img
              src={i.image_url}
              alt={i.title}
              className="mx-auto max-h-[45vh] w-full object-contain"
            />
          </div>
        )}

        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{company}</span>
          </div>
          <h2 className="mt-1.5 text-xl font-bold leading-tight text-white sm:text-2xl">{i.title}</h2>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
              {i.area}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
              {modalityLabel[i.modality]}
            </span>
            {i.location && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                <MapPin className="h-3 w-3" /> {i.location}
              </span>
            )}
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-white/80">Descripción</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/70">
              {i.description}
            </p>
          </div>

          {(i.requirements || i.experience_years != null) && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-white/80">Requisitos</p>
              {i.experience_years != null && (
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  Experiencia: {i.experience_years === 0
                    ? 'Sin experiencia previa'
                    : `${i.experience_years}${i.experience_years >= 5 ? '+' : ''} año${i.experience_years === 1 ? '' : 's'}`}
                </p>
              )}
              {i.requirements && (
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/70">
                  {i.requirements}
                </p>
              )}
            </div>
          )}

          {actions && <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div>}

          <div className="mt-6 border-t border-white/10 pt-2">
            <PostInteractions targetType="internship" targetId={i.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
