import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import logoP from '../../../assets/images/logo-p-blanco.png';
import { readPendingGoogleOnboarding, savePendingGoogleOnboarding } from '../googleOnboarding';
import { sendPushEvent } from '../../../lib/notify';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const providerError = searchParams.get('error_description');
    const allowedTypes: EmailOtpType[] = ['signup', 'email_change', 'email'];
    const emailType = allowedTypes.includes(type as EmailOtpType) ? (type as EmailOtpType) : null;
    if (providerError || (!code && !(tokenHash && emailType))) {
      setError(providerError ?? 'El enlace de acceso no es válido o ya fue utilizado.');
      return;
    }

    const verification = tokenHash && emailType
      ? supabase.auth.verifyOtp({ token_hash: tokenHash, type: emailType })
      : supabase.auth.exchangeCodeForSession(code as string);
    void verification.then(async ({ error: exchangeError }) => {
      if (exchangeError) {
        setError('El enlace venció o ya fue utilizado. Volvé a iniciar el proceso.');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      const isGoogle = user?.app_metadata.provider === 'google' ||
        user?.identities?.some((identity) => identity.provider === 'google');
      const onboardingComplete = user?.user_metadata.pasantia_onboarding_completed === true;
      if (isGoogle && !onboardingComplete) {
        if (!readPendingGoogleOnboarding()) savePendingGoogleOnboarding();
        navigate('/?registro=google', { replace: true });
        return;
      }
      const role = user?.user_metadata.role;
      const memberNotified = user?.user_metadata.pasantia_member_notified === true;
      if (user && !isGoogle && !memberNotified && ['estudiante', 'empresa'].includes(role)) {
        const notified = await sendPushEvent('member', user.id);
        if (notified) {
          await supabase.auth.updateUser({
            data: { ...user.user_metadata, pasantia_member_notified: true },
          });
        }
      }
      navigate('/app', { replace: true });
    });
  }, [navigate, searchParams]);

  return (
    <AuthStatusCard
      icon={error ? <ShieldAlert className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
      title={error ? 'No pudimos validar el acceso' : 'Validando tu acceso'}
      message={error ?? 'Estamos comprobando el enlace de forma segura.'}
    >
      {error && (
        <Link to="/ingresar" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          Volver a ingresar
        </Link>
      )}
    </AuthStatusCard>
  );
}

export function AuthStatusCard({
  icon,
  title,
  message,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="auth-status-screen flex h-[100dvh] items-center justify-center overflow-hidden bg-brand-500 px-4 py-8 sm:px-5 sm:py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/25 bg-white/[0.10] p-6 text-center shadow-[0_24px_70px_-24px_rgba(2,14,56,0.45)] backdrop-blur-xl sm:p-9">
        <img src={logoP} alt="PasantIA" className="mx-auto mb-7 h-11 w-auto" />
        {icon && <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white">{icon}</div>}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-white/75">{message}</p>
        {children}
      </section>
    </main>
  );
}

export { CheckCircle2 };