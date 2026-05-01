import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  roles?: string[];
  requireBranch?: boolean;
}

export default function ProtectedRoute({ roles, requireBranch = true }: Props) {
  const { isAuthenticated, hasBranch, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If branch required but not yet selected, redirect to branch selection
  if (requireBranch && !hasBranch) {
    return <Navigate to="/branches" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
