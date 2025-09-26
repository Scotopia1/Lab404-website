import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoadingSkeleton } from '@/components/ui/LoadingStates';
import { toast } from 'sonner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  requiredRole = 'admin'
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    // Store the attempted location for redirect after login
    return (
      <Navigate
        to="/theElitesSolutions/adminLogin"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check if user has sufficient admin privileges
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'super_admin';
  const hasSuperAdminAccess = user?.role === 'super_admin';

  if (!hasAdminAccess) {
    toast.error('Access Denied', {
      description: 'Administrator privileges required to access this page.',
    });
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'super_admin' && !hasSuperAdminAccess) {
    toast.error('Access Denied', {
      description: 'Super Administrator privileges required for this action.',
    });
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};