import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Protected Route Components for LAB404 e-commerce platform
 * Handles authentication and authorization for protected pages and components
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
  fallbackPath?: string;
  showFallback?: boolean;
}

// Loading component for auth checks
const AuthLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <p className="text-gray-600 font-medium">Checking authentication...</p>
    </motion.div>
  </div>
);

// Unauthorized access component
const UnauthorizedFallback: React.FC<{ 
  requireAdmin?: boolean;
  onGoBack?: () => void;
  onSignIn?: () => void;
}> = ({ requireAdmin = false, onGoBack, onSignIn }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            {requireAdmin ? (
              <ShieldAlert className="h-8 w-8 text-red-600" />
            ) : (
              <Shield className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl text-red-600">
            {requireAdmin ? 'Admin Access Required' : 'Authentication Required'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {requireAdmin 
              ? 'You need administrator privileges to access this page.'
              : 'Please sign in to access this page.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {!requireAdmin && onSignIn && (
            <Button onClick={onSignIn} className="w-full">
              Sign In
            </Button>
          )}
          
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack} className="w-full">
              Go Back
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'} 
            className="w-full"
          >
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

// Main protected route component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireAuth = true,
  fallbackPath,
  showFallback = true,
}) => {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return showFallback ? <AuthLoadingFallback /> : null;
  }

  // Development bypass - completely skip authentication in dev mode
  if (import.meta.env.DEV && localStorage.getItem('lab404_dev_bypass_all') === 'true') {
    console.log('🔓 Development mode: Bypassing all authentication checks');
    return <>{children}</>;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (fallbackPath) {
      return (
        <Navigate 
          to={fallbackPath} 
          state={{ from: location.pathname }}
          replace 
        />
      );
    }
    
    if (showFallback) {
      return (
        <UnauthorizedFallback
          onGoBack={() => window.history.back()}
          onSignIn={() => window.location.href = '/auth/login'}
        />
      );
    }
    
    return null;
  }

  // Check admin requirement
  if (requireAdmin && isAuthenticated && !isAdmin()) {
    if (fallbackPath) {
      return (
        <Navigate 
          to={fallbackPath} 
          state={{ from: location.pathname }}
          replace 
        />
      );
    }
    
    if (showFallback) {
      return (
        <UnauthorizedFallback
          requireAdmin
          onGoBack={() => window.history.back()}
        />
      );
    }
    
    return null;
  }

  // Render protected content
  return <>{children}</>;
};

// Convenience components for common use cases
export const RequireAuth: React.FC<{ 
  children: React.ReactNode;
  fallbackPath?: string;
}> = ({ children, fallbackPath = '/auth/login' }) => (
  <ProtectedRoute requireAuth fallbackPath={fallbackPath}>
    {children}
  </ProtectedRoute>
);

export const RequireAdmin: React.FC<{ 
  children: React.ReactNode;
  fallbackPath?: string;
}> = ({ children, fallbackPath }) => (
  <ProtectedRoute requireAdmin fallbackPath={fallbackPath}>
    {children}
  </ProtectedRoute>
);

// Component-level protection for smaller UI elements
interface ProtectedComponentProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requireAdmin = false,
  requireAuth = true,
  fallback = null,
  showError = false,
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (requireAuth && !isAuthenticated) {
    if (showError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Authentication required</span>
          </div>
        </div>
      );
    }
    return fallback;
  }

  if (requireAdmin && isAuthenticated && !isAdmin()) {
    if (showError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm">Admin access required</span>
          </div>
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
};

// Hook for conditional rendering based on auth state
export const useConditionalRender = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();

  return {
    // Render only for authenticated users
    ifAuth: (component: React.ReactNode) => isAuthenticated ? component : null,
    
    // Render only for non-authenticated users
    ifGuest: (component: React.ReactNode) => !isAuthenticated ? component : null,
    
    // Render only for admin users
    ifAdmin: (component: React.ReactNode) => isAuthenticated && isAdmin() ? component : null,
    
    // Render only for non-admin users
    ifUser: (component: React.ReactNode) => isAuthenticated && !isAdmin() ? component : null,
    
    // Conditional render with custom check
    ifCondition: (condition: boolean, component: React.ReactNode) => condition ? component : null,
    
    // Get current user info for conditional logic
    user,
    isAuthenticated,
    isAdmin: isAdmin(),
  };
};

// Navigation guard hook for programmatic route protection
export const useNavigationGuard = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return {
    canAccess: (requireAdmin = false, requireAuth = true) => {
      if (requireAuth && !isAuthenticated) return false;
      if (requireAdmin && (!isAuthenticated || !isAdmin())) return false;
      return true;
    },
    
    guardedNavigate: (
      to: string, 
      options: { requireAdmin?: boolean; requireAuth?: boolean } = {}
    ) => {
      const { requireAdmin = false, requireAuth = true } = options;
      
      if (requireAuth && !isAuthenticated) {
        window.location.href = '/auth/login';
        return false;
      }
      
      if (requireAdmin && (!isAuthenticated || !isAdmin())) {
        window.location.href = '/';
        return false;
      }
      
      window.location.href = to;
      return true;
    },
  };
};

export default ProtectedRoute;