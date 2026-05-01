import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface Props {
  roles?: string[];
  requireBranch?: boolean;
  userKind?: 'app' | 'bank';
  children?: ReactNode;
}

export default function ProtectedRoute({ roles, requireBranch = true, userKind, children }: Props) {
  const { isAuthenticated, hasBranch, hasOffice, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireBranch && !hasOffice && !hasBranch) {
    return <Navigate to="/offices" replace />;
  }

  if (userKind && user?.userKind && user.userKind !== userKind) {
    return <Navigate to="/dashboard" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
