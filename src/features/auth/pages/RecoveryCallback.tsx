import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AuthStatusCard } from './AuthCallback';

const RECOVERY_GRANT_KEY = 'pasantia_password_recovery_grant';

export default function RecoveryCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    if (!code && !tokenHash) {
      setError('El enlace de recuperación no es válido.');
      return;
    }

    const verification = tokenHash
      ? supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      : supabase.auth.exchangeCodeForSession(code as string);
    void verification.then(({ error: exchangeError }) => {
      if (exchangeError) {
        setError('El enlace venció o ya fue utilizado. Solicitá uno nuevo.');
        return;
      }
      sessionStorage.setItem(RECOVERY_GRANT_KEY, String(Date.now()));
      navigate('/restablecer-password', { replace: true });
    });
  }, [navigate, searchParams]);

  return (
    <AuthStatusCard
      icon={error ? <ShieldAlert className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
      title={error ? 'No pudimos validar el enlace' : 'Validando recuperación'}
      message={error ?? 'Comprobando el enlace de un solo uso.'}
    >
      {error && <Link to="/recuperar-password" className="mt-6 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-400">Solicitar otro enlace</Link>}
    </AuthStatusCard>
  );
}

export { RECOVERY_GRANT_KEY };