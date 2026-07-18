// Página de ingreso (login).
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { FormRow, TextField } from '../../ui/Field';
import { AuthShell } from './AuthShell';
import { useAuth } from '../AuthProvider';
import { isSupabaseConfigured } from '../../../lib/supabase';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Accedé a tu panel de PasantIA."
      footer={
        <>
          ¿Todavía no te sumaste?{' '}
          <Link to="/" className="font-semibold text-white hover:underline">
            Pedí acceso anticipado
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured && (
        <p className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          Falta configurar Supabase. Copiá <code>.env.example</code> a{' '}
          <code>.env.local</code> con tus credenciales.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Email" htmlFor="email">
          <TextField
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </FormRow>

        <FormRow label="Contraseña" htmlFor="password">
          <TextField
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormRow>

        {error && (
          <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </AuthShell>
  );
}
