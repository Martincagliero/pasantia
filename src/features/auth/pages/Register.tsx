// Página de registro con selección de rol
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Users, Megaphone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FormRow, TextField } from '../../ui/Field';
import { AuthShell } from './AuthShell';
import { useAuth } from '../AuthProvider';
import type { Role } from '../../../lib/database.types';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roles: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'estudiante',
      label: 'Estudiante',
      description: 'Busca pasantías y oportunidades',
      icon: <Users className="h-6 w-6" />,
    },
    {
      value: 'empresa',
      label: 'Empresa',
      description: 'Publica pasantías y encuentra talento',
      icon: <Building2 className="h-6 w-6" />,
    },
    {
      value: 'embajador',
      label: 'Embajador',
      description: 'Difunde oportunidades en tu comunidad',
      icon: <Megaphone className="h-6 w-6" />,
    },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;

    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role: selectedRole,
    });

    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    navigate('/app', { replace: true });
  }

  if (step === 'role') {
    return (
      <AuthShell
        title="¿Eres estudiante, empresa o embajador?"
        subtitle="Selecciona tu rol para continuar"
        footer={
          <>
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingresar" className="font-semibold text-white hover:underline">
              Ingresá aquí
            </Link>
          </>
        }
      >
        <div className="space-y-3">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => {
                setSelectedRole(role.value);
                setStep('form');
              }}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-white/5 p-5 transition-all hover:border-white/40 hover:bg-white/10"
            >
              <div className="text-white/70">{role.icon}</div>
              <div className="text-left">
                <div className="font-semibold text-white">{role.label}</div>
                <div className="text-sm text-white/60">{role.description}</div>
              </div>
            </button>
          ))}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle={`Registrate como ${selectedRole === 'estudiante' ? 'estudiante' : selectedRole === 'empresa' ? 'empresa' : 'embajador'}`}
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link to="/ingresar" className="font-semibold text-brand-400 hover:text-brand-300">
            Ingresá aquí
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow label="Nombre completo" htmlFor="fullName">
          <TextField
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
          />
        </FormRow>

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormRow>

        <FormRow label="Confirmar contraseña" htmlFor="confirmPassword">
          <TextField
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormRow>

        {error && (
          <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            disabled={loading}
            onClick={() => setStep('role')}
          >
            Atrás
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Registrando…' : 'Registrarse'}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
