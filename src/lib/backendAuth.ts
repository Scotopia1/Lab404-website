import { apiClient, TokenManager } from '@/api/client';
import { errorHandler } from './errorHandler';
import type { User as AppUser } from './types';

/**
 * Backend API Authentication Service for LAB404 Admin Panel
 * Uses the new backend API instead of Supabase
 */

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

export class BackendAuthService {
  private static instance: BackendAuthService;
  private currentUser: AppUser | null = null;
  private authStateListeners: Set<(user: AppUser | null) => void> = new Set();

  static getInstance(): BackendAuthService {
    if (!BackendAuthService.instance) {
      BackendAuthService.instance = new BackendAuthService();
    }
    return BackendAuthService.instance;
  }

  private constructor() {
    this.initialize();
  }

  /**
   * Initialize auth service and check for existing session
   */
  private async initialize() {
    try {
      // Check if we have a stored token
      const token = TokenManager.getAccessToken();
      if (token) {
        // Try to get current user to validate session
        // But don't throw errors for initial load
        try {
          await this.getCurrentUser();
        } catch (error: any) {
          // Only clear tokens if it's a real auth error, not network issues
          if (error.statusCode === 401 || error.statusCode === 403) {
            console.log('🔓 Session expired, clearing tokens');
            TokenManager.clearTokens();
          } else {
            console.log('📡 Network error during auth initialization, keeping tokens for retry');
          }
        }
      }
    } catch (error) {
      console.error('Auth service initialization failed:', error);
      // Clear invalid tokens only on auth errors
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as any).statusCode;
        if (statusCode === 401 || statusCode === 403) {
          TokenManager.clearTokens();
        }
      }
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      // Check if we have a token before trying to get user
      const token = TokenManager.getAccessToken();
      if (!token) {
        this.currentUser = null;
        this.notifyListeners(null);
        return null;
      }

      const userData = await apiClient.getCurrentUser();
      const appUser = this.transformAdminUser(userData);
      this.currentUser = appUser;
      this.notifyListeners(appUser);
      return appUser;
    } catch (error: any) {
      // Don't log 401 errors as they're expected when not authenticated
      if (error?.statusCode !== 401) {
        console.error('Error getting current user:', error);
      }
      this.currentUser = null;
      this.notifyListeners(null);
      return null;
    }
  }

  /**
   * Transform admin user to app user format
   */
  private transformAdminUser(userData: AdminUser): AppUser {
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: userData.role === 'super_admin' ? 'admin' : 'admin', // Map both to admin for frontend
      avatar: userData.avatar_url,
      createdAt: userData.created_at,
      updatedAt: userData.created_at, // Backend doesn't have updated_at in response
    };
  }

  /**
   * Sign in with email and password using backend API
   */
  async signIn({ email, password }: SignInData): Promise<AuthResponse<AppUser>> {
    try {
      console.log('🔐 Attempting backend login for:', email);

      const response = await apiClient.login(email.trim().toLowerCase(), password);

      if (response.user) {
        const appUser = this.transformAdminUser(response.user);
        this.currentUser = appUser;
        this.notifyListeners(appUser);

        console.log('✅ Backend login successful');
        return {
          data: appUser,
          error: null
        };
      }

      return {
        data: null,
        error: 'Login failed - no user data returned'
      };
    } catch (error: any) {
      console.error('❌ Backend login failed:', error);

      let errorMessage = 'Login failed';
      if (error.statusCode === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.statusCode === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      errorHandler.handleError(error, {
        component: 'BackendAuthService',
        action: 'signIn',
        email
      });

      return {
        data: null,
        error: errorMessage
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      // Call backend logout endpoint
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local logout even if backend call fails
    } finally {
      // Clear local state regardless
      TokenManager.clearTokens();
      this.currentUser = null;
      this.notifyListeners(null);
      console.log('🔓 User logged out');
    }
  }

  /**
   * Get current user (synchronous)
   */
  getUser(): AppUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && TokenManager.getAccessToken() !== null;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Add auth state listener
   */
  onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    this.authStateListeners.add(callback);

    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners(user: AppUser | null) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Refresh authentication token
   */
  async refreshAuth(): Promise<void> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Use the refresh method from API client
      const success = await apiClient.refreshToken();
      if (!success) {
        throw new Error('Token refresh failed');
      }

      // Get updated user data
      await this.getCurrentUser();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Sign out on refresh failure
      await this.signOut();
    }
  }
}

// Export singleton instance
export const backendAuthService = BackendAuthService.getInstance();