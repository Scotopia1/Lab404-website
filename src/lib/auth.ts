import { 
  User, 
  Session, 
  AuthError, 
  AuthChangeEvent,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js';
import { supabase } from './supabase';
import { adminConfig } from './env';
import { errorHandler } from './errorHandler';
import type { User as AppUser, AuthState } from './types';

/**
 * Enhanced authentication service for LAB404 e-commerce platform
 * Provides comprehensive auth functionality with role-based access control
 */

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AppUser | null = null;
  private currentSession: Session | null = null;
  private authStateListeners: Set<(user: AppUser | null) => void> = new Set();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initialize();
  }

  /**
   * Initialize auth service and set up listeners
   */
  private async initialize() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting initial session:', error);
        return;
      }

      if (session) {
        await this.handleAuthStateChange(session);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        await this.handleAuthStateChange(session);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in');
            break;
          case 'SIGNED_OUT':
            console.log('User signed out');
            this.currentUser = null;
            this.currentSession = null;
            this.notifyListeners(null);
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('User updated');
            break;
        }
      });
    } catch (error) {
      console.error('Auth service initialization failed:', error);
      errorHandler.handleError(error, { component: 'AuthService', action: 'initialize' });
    }
  }

  /**
   * Handle auth state changes and update current user
   */
  private async handleAuthStateChange(session: Session | null) {
    this.currentSession = session;

    if (session?.user) {
      try {
        const appUser = await this.transformSupabaseUser(session.user);
        this.currentUser = appUser;
        this.notifyListeners(appUser);
      } catch (error) {
        console.error('Error transforming user:', error);
        this.currentUser = null;
        this.notifyListeners(null);
      }
    } else {
      this.currentUser = null;
      this.notifyListeners(null);
    }
  }

  /**
   * Transform Supabase user to app user format
   */
  private async transformSupabaseUser(user: User): Promise<AppUser> {
    // Check if user is admin based on email
    const isAdmin = user.email === adminConfig.email;

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || '',
      role: isAdmin ? 'admin' : 'user',
      avatar: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  }

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse<AppUser>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const errorMessage = this.getAuthErrorMessage(error);
        return { data: null, error: errorMessage };
      }

      if (data.user) {
        const appUser = await this.transformSupabaseUser(data.user);
        return { data: appUser, error: null };
      }

      return { data: null, error: 'Sign in failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred during sign in' 
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp({ email, password, name }: SignUpData): Promise<AuthResponse<AppUser>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        const errorMessage = this.getAuthErrorMessage(error);
        return { data: null, error: errorMessage };
      }

      if (data.user) {
        const appUser = await this.transformSupabaseUser(data.user);
        return { data: appUser, error: null };
      }

      return { data: null, error: 'Sign up failed' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred during sign up' 
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { data: null, error: error.message };
      }

      this.currentUser = null;
      this.currentSession = null;
      return { data: null, error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred during sign out' 
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred while resetting password' 
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { name?: string; avatar_url?: string }): Promise<AuthResponse<AppUser>> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (data.user) {
        const appUser = await this.transformSupabaseUser(data.user);
        return { data: appUser, error: null };
      }

      return { data: null, error: 'Profile update failed' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred while updating profile' 
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(newPassword: string): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred while changing password' 
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: 'admin' | 'user'): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Add auth state listener
   */
  addAuthStateListener(listener: (user: AppUser | null) => void): () => void {
    this.authStateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  /**
   * Notify all auth state listeners
   */
  private notifyListeners(user: AppUser | null) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  /**
   * Get user-friendly auth error messages
   */
  private getAuthErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.';
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.';
      case 'Email rate limit exceeded':
        return 'Too many requests. Please wait a moment before trying again.';
      default:
        return error.message || 'An authentication error occurred. Please try again.';
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (password.length > 72) {
      errors.push('Password must be less than 72 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create admin user (for development/setup)
   */
  async createAdminUser(): Promise<AuthResponse<AppUser>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: adminConfig.email,
        password: adminConfig.password,
        options: {
          data: {
            name: 'LAB404 Administrator',
            role: 'admin',
          },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (data.user) {
        const appUser = await this.transformSupabaseUser(data.user);
        return { data: appUser, error: null };
      }

      return { data: null, error: 'Admin user creation failed' };
    } catch (error) {
      console.error('Create admin user error:', error);
      return { 
        data: null, 
        error: 'An unexpected error occurred while creating admin user' 
      };
    }
  }
}

// Singleton instance
export const authService = AuthService.getInstance();

// Export convenience functions
export const {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updateProfile,
  changePassword,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  isAdmin,
  hasRole,
  addAuthStateListener,
  isValidEmail,
  validatePassword,
} = authService;

export default authService;