// Redirección del índice /app hacia la primera sección según el rol.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PageLoader } from '../ui/primitives';

export default function DashboardHome() {
  const { profile, loading, profileLoading, adminViewRole } = useAuth();
  // Esperamos a tener el perfil resuelto para redirigir al panel correcto y no
  // "parpadear" mostrando primero el panel de estudiante por defecto.
  if (loading || (profileLoading && !profile)) return <PageLoader />;
  // Admin: si eligió ver un panel de rol, lo respetamos; si no, va a Administración.
  if (profile?.is_admin && !adminViewRole) return <Navigate to="/app/admin" replace />;
  const role = profile?.is_admin && adminViewRole ? adminViewRole : profile?.role;
  if (role === 'empresa') return <Navigate to="/app/inicio" replace />;
  if (role === 'embajador') return <Navigate to="/app/embajador" replace />;
  return <Navigate to="/app/inicio-estudiante" replace />;
}
