// Barra de progreso "completá tu perfil". Se oculta sola cuando llega al 100%.
import { Card } from './primitives';

export interface CompletionField {
  label: string;
  done: boolean;
}

export function ProfileCompletion({ fields }: { fields: CompletionField[] }) {
  const total = fields.length;
  const completed = fields.filter((f) => f.done).length;
  const pct = total === 0 ? 100 : Math.round((completed / total) * 100);

  // Cuando el perfil está completo, el indicador desaparece.
  if (pct >= 100) return null;

  const missing = fields.filter((f) => !f.done).map((f) => f.label);

  return (
    <Card className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">Completá tu perfil</h3>
        <span className="text-sm font-semibold text-brand-300">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {missing.length > 0 && (
        <p className="mt-2.5 text-xs text-white/55">
          Falta completar: {missing.slice(0, 6).join(', ')}
          {missing.length > 6 ? '…' : ''}
        </p>
      )}
    </Card>
  );
}
