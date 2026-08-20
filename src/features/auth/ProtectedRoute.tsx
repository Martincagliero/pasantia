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
  const { session, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Esperamos también a que el perfil (rol) esté resuelto cuando aún no lo
  // tenemos, para no renderizar el panel equivocado y provocar un parpadeo.
  if (loading || (profileLoading && !profile)) {
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
  // Los admins pueden entrar a cualquier panel (para cambiar de rol/vista).
  if (role && profile && !profile.is_admin && profile.role !== role) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
