import { useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { SubscriptionPlan } from '../../lib/database.types';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../ui/primitives';

export function UpgradePrompt({
  title,
  description,
  plan = 'pro',
  planName,
  compact = false,
}: {
  title: string;
  description: string;
  plan?: Exclude<SubscriptionPlan, 'free'>;
  planName?: string;
  compact?: boolean;
}) {
  const { profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function requestPlan() {
    if (!profile || sending || sent) return;
    setSending(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const { error: requestError } = await supabase.from('plan_requests').insert({
        user_id: profile.id,
        requested_plan: plan,
        kind: 'subscription',
        message: `Solicitud desde: ${title}`,
      }).abortSignal(controller.signal);
      if (requestError) {
        if (requestError.code === '23505') {
          setSent(true);
          return;
        }
        setError(/plan_requests|schema cache|relation/i.test(requestError.message)
          ? 'Falta ejecutar la migración freemium en Supabase.'
          : 'No pudimos enviar la solicitud. Intentá nuevamente.');
        return;
      }
      setSent(true);
    } catch (requestError) {
      const aborted = controller.signal.aborted || (requestError instanceof Error && requestError.name === 'AbortError');
      setError(aborted
        ? 'La conexión tardó demasiado. Revisá internet e intentá nuevamente.'
        : 'No pudimos enviar la solicitud. Intentá nuevamente.');
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  }

  const content = (
    <>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-white/60">{description}</p>
      <button
        type="button"
        onClick={() => void requestPlan()}
        disabled={sending || sent}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-brand-400 disabled:opacity-60"
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" />}
        {sent ? 'Solicitud enviada' : `Solicitar plan ${planName ?? (plan === 'enterprise' ? 'Empresa' : 'Pro')}`}
        {!sending && !sent && <ArrowUpRight className="h-4 w-4" />}
      </button>
      {sent && <p className="mt-2 text-xs text-white/50">La solicitud ya aparece en el panel de PasantIA.</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </>
  );

  if (compact) return <div className="border-t border-white/10 pt-4 text-center">{content}</div>;
  return <Card className="mx-auto max-w-xl text-center">{content}</Card>;
}