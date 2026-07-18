// Redirección del índice /app hacia la primera sección según el rol.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PageLoader } from '../ui/primitives';

export default function DashboardHome() {
  const { profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (profile?.role === 'empresa') return <Navigate to="/app/inicio" replace />;
  if (profile?.role === 'embajador') return <Navigate to="/app/embajador" replace />;
  return <Navigate to="/app/pasantias" replace />;
}
