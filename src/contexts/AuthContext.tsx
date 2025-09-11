import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authService } from '@/lib/auth';
import type { User, AuthState } from '@/lib/types';
import { errorHandler } from '@/lib/errorHandler';

/**
 * Authentication Context and Provider for LAB404 e-commerce platform
 * Provides authentication state and actions throughout the app
 */

interface AuthContextType extends AuthState {
  // Authentication actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  
  // Utility functions
  isAdmin: () => boolean;
  hasRole: (role: 'admin' | 'user') => boolean;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

// Auth reducer actions
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SIGN_OUT' };

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'SIGN_OUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
}

// Initial auth state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Get current user from auth service
        const currentUser = authService.getCurrentUser();
        
        if (isMounted) {
          dispatch({ type: 'SET_USER', payload: currentUser });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' });
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const unsubscribe = authService.addAuthStateListener((user) => {
      if (isMounted) {
        dispatch({ type: 'SET_USER', payload: user });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data, error } = await authService.signIn({ email, password });

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
        return { success: false, error };
      }

      if (data) {
        dispatch({ type: 'SET_USER', payload: data });
        return { success: true };
      }

      const fallbackError = 'Sign in failed';
      dispatch({ type: 'SET_ERROR', payload: fallbackError });
      return { success: false, error: fallbackError };
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = 'An unexpected error occurred during sign in';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      errorHandler.handleError(error, { component: 'AuthContext', action: 'signIn' });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data, error } = await authService.signUp({ email, password, name });

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
        return { success: false, error };
      }

      if (data) {
        dispatch({ type: 'SET_USER', payload: data });
        return { success: true };
      }

      const fallbackError = 'Sign up failed';
      dispatch({ type: 'SET_ERROR', payload: fallbackError });
      return { success: false, error: fallbackError };
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = 'An unexpected error occurred during sign up';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      errorHandler.handleError(error, { component: 'AuthContext', action: 'signUp' });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { error } = await authService.signOut();
      
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
        return;
      }

      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign out' });
      errorHandler.handleError(error, { component: 'AuthContext', action: 'signOut' });
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { error } = await authService.resetPassword(email);

      dispatch({ type: 'SET_LOADING', payload: false });

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = 'Failed to send reset password email';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
      errorHandler.handleError(error, { component: 'AuthContext', action: 'resetPassword' });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data, error } = await authService.updateProfile({
        name: updates.name,
        avatar_url: updates.avatar,
      });

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
        return { success: false, error };
      }

      if (data) {
        dispatch({ type: 'SET_USER', payload: data });
        return { success: true };
      }

      const fallbackError = 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: fallbackError });
      return { success: false, error: fallbackError };
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = 'Failed to update profile';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      errorHandler.handleError(error, { component: 'AuthContext', action: 'updateProfile' });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Utility functions
  const isAdmin = useCallback(() => {
    return authService.isAdmin();
  }, [state.user]);

  const hasRole = useCallback((role: 'admin' | 'user') => {
    return authService.hasRole(role);
  }, [state.user]);

  const refreshAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Force refresh the session
      const currentUser = authService.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: currentUser });
    } catch (error) {
      console.error('Refresh auth error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh authentication' });
      errorHandler.handleError(error, { component: 'AuthContext', action: 'refreshAuth' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    // State
    ...state,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    
    // Utility functions
    isAdmin,
    hasRole,
    refreshAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Hook for protected operations that require authentication
export const useRequireAuth = (redirectTo?: string) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, redirectTo]);

  return auth;
};

// Hook for admin-only operations
export const useRequireAdmin = (redirectTo?: string) => {
  const auth = useRequireAuth(redirectTo);

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.isAdmin()) {
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        // Show unauthorized error
        errorHandler.handleError(
          new Error('Admin access required'), 
          { component: 'useRequireAdmin', action: 'access_check' }
        );
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.user, redirectTo]);

  return auth;
};

// Higher-order component for protected routes
interface WithAuthProps {
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: React.ComponentType;
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) => {
  const { requireAdmin = false, redirectTo = '/auth/login', fallback: Fallback } = options;

  const AuthenticatedComponent: React.FC<P> = (props) => {
    const auth = requireAdmin ? useRequireAdmin(redirectTo) : useRequireAuth(redirectTo);

    if (auth.isLoading) {
      return Fallback ? <Fallback /> : <div>Loading...</div>;
    }

    if (!auth.isAuthenticated) {
      return Fallback ? <Fallback /> : <div>Access denied</div>;
    }

    if (requireAdmin && !auth.isAdmin()) {
      return Fallback ? <Fallback /> : <div>Admin access required</div>;
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

export default AuthContext;