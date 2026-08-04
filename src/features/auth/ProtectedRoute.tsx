// Ruta protegida: exige sesión activa. Opcionalmente exige un rol específico.
// Si no hay sesión, redirige a /ingresar. Si el rol no coincide, manda al panel correcto.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import type { Role } from '../../lib/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se define, solo usuarios con este rol pueden entrar. */
  role?: Role;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />;
  }

  // Si el rol requerido no coincide, lo mandamos a su propio panel.
  if (role && profile && profile.role !== role) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
