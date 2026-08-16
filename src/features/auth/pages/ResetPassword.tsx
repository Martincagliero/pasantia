import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AuthStatusCard } from './AuthCallback';
import { RECOVERY_GRANT_KEY } from './RecoveryCallback';

const RECOVERY_WINDOW_MS = 15 * 60 * 1000;

function validatePassword(password: string): string | null {
  if (password.length < 12) return 'Usá al menos 12 caracteres.';
  if (!/[a-z]/.test(password)) return 'Agregá al menos una minúscula.';
  if (!/[A-Z]/.test(password)) return 'Agregá al menos una mayúscula.';
  if (!/[0-9]/.test(password)) return 'Agregá al menos un número.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Agregá al menos un símbolo.';
  return null;
}

export default function ResetPassword() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const grantedAt = Number(sessionStorage.getItem(RECOVERY_GRANT_KEY));
    void supabase.auth.getSession().then(({ data }) => {
      setAuthorized(Boolean(data.session && grantedAt && Date.now() - grantedAt < RECOVERY_WINDOW_MS));
      setChecking(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    sessionStorage.removeItem(RECOVERY_GRANT_KEY);
    await supabase.auth.signOut({ scope: 'global' });
    setLoading(false);
    setComplete(true);
  }

  if (checking) return <AuthStatusCard title="Validando sesión" message="Comprobando tu autorización de recuperación." />;
  if (!authorized) {
    return (
      <AuthStatusCard icon={<ShieldAlert className="h-7 w-7" />} title="Acceso no válido" message="Abrí esta pantalla desde el enlace que enviamos a tu email. El enlace puede haber vencido.">
        <Link to="/recuperar-password" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Solicitar otro enlace</Link>
      </AuthStatusCard>
    );
  }
  if (complete) {
    return (
      <AuthStatusCard icon={<CheckCircle2 className="h-7 w-7" />} title="Contraseña actualizada" message="Cerramos todas las sesiones de tu cuenta. Ya podés ingresar con tu contraseña nueva.">
        <Link to="/ingresar" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Ingresar de nuevo</Link>
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard title="Creá una contraseña nueva" message="Debe ser única y tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo.">
      <form onSubmit={handleSubmit} className="mt-7 space-y-4 text-left">
        <PasswordField id="new-password" label="Nueva contraseña" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
        <PasswordField id="confirm-password" label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
        {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-white py-3.5 text-[15px] font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60">
          {loading ? 'Actualizando…' : 'Actualizar contraseña'}
        </button>
      </form>
    </AuthStatusCard>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/75">{label}</label>
      <div className="flex items-center gap-2.5 rounded-xl border border-white/30 bg-white/[0.12] px-3.5 transition focus-within:border-white focus-within:bg-white/[0.16]">
        <Lock className="h-[18px] w-[18px] shrink-0 text-white/75" />
        <input id={id} type={visible ? 'text' : 'password'} autoComplete="new-password" required value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent py-3 text-[15px] text-white outline-none" />
        <button type="button" onClick={onToggle} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="text-white/70 hover:text-white">
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );
}