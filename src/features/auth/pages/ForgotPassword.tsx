import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { AuthStatusCard } from './AuthCallback';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    await requestPasswordReset(email.trim());
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthStatusCard
        icon={<CheckCircle2 className="h-7 w-7" />}
        title="Revisá tu email"
        message="Si existe una cuenta asociada, vas a recibir un enlace para crear una contraseña nueva. También revisá spam."
      >
        <Link to="/ingresar" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-300 hover:text-brand-200">
          <ArrowLeft className="h-4 w-4" /> Volver a ingresar
        </Link>
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard title="Recuperá tu cuenta" message="Ingresá tu email y te enviaremos un enlace de recuperación de un solo uso.">
      <form onSubmit={handleSubmit} className="mt-7 text-left">
        <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-white/75">Email</label>
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#12151E] px-3.5 focus-within:border-brand-400/60">
          <Mail className="h-[18px] w-[18px] shrink-0 text-white/40" />
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-transparent py-3 text-[15px] text-white outline-none placeholder:text-white/35"
            placeholder="tu@email.com"
          />
        </div>
        <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-brand-500 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-400 disabled:opacity-60">
          {loading ? 'Enviando…' : 'Enviar enlace seguro'}
        </button>
      </form>
      <Link to="/ingresar" className="mt-6 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Volver a ingresar
      </Link>
    </AuthStatusCard>
  );
}