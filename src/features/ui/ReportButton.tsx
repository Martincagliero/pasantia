// Botón + modal de denuncia reutilizable (moderación).
// Permite reportar una pasantía, un anuncio de comunidad o un perfil.
// El reporte se guarda en la tabla `reports` (ver migracion-reportes.sql) y queda
// privado: solo el dueño de la plataforma lo revisa desde Supabase.
import { useState } from 'react';
import { Flag, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { ReportTargetType } from '../../lib/database.types';
import { Button } from '../../components/ui/Button';
import { SelectField, TextArea } from './Field';

const REASONS: Record<ReportTargetType, { value: string; label: string }[]> = {
  internship: [
    { value: 'falsa', label: 'Pasantía falsa o engañosa' },
    { value: 'estafa', label: 'Parece una estafa' },
    { value: 'no_es_pasantia', label: 'No es una pasantía' },
    { value: 'discriminatorio', label: 'Contenido discriminatorio' },
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'otro', label: 'Otro' },
  ],
  community_post: [
    { value: 'acoso', label: 'Acoso o discurso de odio' },
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'ilegal', label: 'Contenido ilegal' },
    { value: 'copyright', label: 'Infringe derechos de autor' },
    { value: 'discriminatorio', label: 'Contenido discriminatorio' },
    { value: 'otro', label: 'Otro' },
  ],
  profile: [
    { value: 'suplantacion', label: 'Suplanta a una empresa o persona' },
    { value: 'falso', label: 'Perfil falso' },
    { value: 'acoso', label: 'Acoso o discurso de odio' },
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'otro', label: 'Otro' },
  ],
};

const TARGET_LABEL: Record<ReportTargetType, string> = {
  internship: 'esta pasantía',
  community_post: 'este anuncio',
  profile: 'este perfil',
};

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Estilo: icono suelto (por defecto) o botón con texto. */
  variant?: 'icon' | 'button';
  className?: string;
}

export function ReportButton({ targetType, targetId, variant = 'icon', className = '' }: ReportButtonProps) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[targetType][0].value);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    // Reset tras cerrar para que la próxima apertura arranque limpia.
    setTimeout(() => {
      setReason(REASONS[targetType][0].value);
      setDetails('');
      setDone(false);
      setError(null);
    }, 200);
  }

  async function handleSubmit() {
    if (!session) {
      setError('Necesitás iniciar sesión para reportar.');
      return;
    }
    setSending(true);
    setError(null);
    const { error: err } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSending(false);
    if (err) {
      const msg = err.message ?? String(err);
      if (/reports|does not exist|relation|schema cache/i.test(msg)) {
        setError(
          'Falta crear la tabla de reportes. Ejecutá supabase/migracion-reportes.sql en el SQL Editor de Supabase.'
        );
      } else {
        setError('No se pudo enviar el reporte. Intentá de nuevo.');
      }
      return;
    }
    setDone(true);
  }

  return (
    <>
      {variant === 'button' ? (
        <button
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-red-300 ${className}`}
        >
          <Flag size={16} /> Reportar
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`shrink-0 rounded-lg p-1.5 text-white/35 transition hover:bg-white/10 hover:text-red-300 ${className}`}
          title="Reportar"
          aria-label="Reportar"
        >
          <Flag className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
          onClick={close}
        >
          <div
            className="glass w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl border border-white/12 p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-lg font-bold text-white">Reporte enviado</h2>
                <p className="mt-2 text-sm text-white/60">
                  Gracias. Nuestro equipo lo va a revisar. Las denuncias son confidenciales.
                </p>
                <div className="mt-5">
                  <Button as="button" variant="secondary" size="sm" onClick={close}>
                    Cerrar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1 inline-flex items-center gap-2 text-red-300">
                  <Flag className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Reportar</span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  ¿Por qué querés reportar {TARGET_LABEL[targetType]}?
                </h2>
                <p className="mt-1.5 text-sm text-white/55">
                  Tu reporte es anónimo para el resto de los usuarios.
                </p>

                <div className="mt-5 space-y-3">
                  <SelectField value={reason} onChange={(e) => setReason(e.target.value)}>
                    {REASONS[targetType].map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </SelectField>
                  <TextArea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Contanos más (opcional)…"
                    rows={3}
                  />
                </div>

                {error && (
                  <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <Button as="button" variant="ghost" size="sm" onClick={close}>
                    Cancelar
                  </Button>
                  <Button as="button" variant="secondary" size="sm" onClick={handleSubmit} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar reporte'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
