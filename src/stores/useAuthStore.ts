import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { db } from '../lib/services/database'
import type { User } from '@supabase/supabase-js'
import type { ProfileData } from '../lib/validation'
import type { ApiResponse } from '../lib/types'

// =============================================
// TYPES
// =============================================

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  role: 'admin' | 'user'
  phone?: string | null
  address?: string | null
  city?: string | null
  country: string
  isAdmin: boolean
  preferences?: Record<string, any>
}

export interface AuthStoreState {
  // User data
  user: AuthUser | null
  profile: ProfileData | null
  
  // Auth states
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  
  // Loading states
  profileLoading: boolean
  
  // Error states
  error: string | null
  
  // Session info
  session: any | null
  
  // UI state
  showAuthModal: boolean
  authMode: 'signin' | 'signup' | 'forgot-password' | 'reset-password'
}

export interface AuthStoreActions {
  // Authentication
  signIn: (email: string, password: string) => Promise<ApiResponse<AuthUser>>
  signUp: (email: string, password: string, name: string) => Promise<ApiResponse<AuthUser>>
  signOut: () => Promise<void>
  
  // Password management
  resetPassword: (email: string) => Promise<ApiResponse<boolean>>
  updatePassword: (newPassword: string) => Promise<ApiResponse<boolean>>
  
  // Profile management
  updateProfile: (updates: Partial<ProfileData>) => Promise<ApiResponse<ProfileData>>
  refreshProfile: () => Promise<void>
  
  // Session management
  refreshSession: () => Promise<void>
  initializeAuth: () => Promise<void>
  
  // UI management
  showSignIn: () => void
  showSignUp: () => void
  showForgotPassword: () => void
  hideAuthModal: () => void
  
  // Utility
  clearErrors: () => void
  checkIsAdmin: () => boolean
  
  // Internal
  setUser: (user: AuthUser | null) => void
  setSession: (session: any) => void
}

export type AuthStore = AuthStoreState & AuthStoreActions

// =============================================
// HELPER FUNCTIONS
// =============================================

const convertSupabaseUserToAuthUser = (user: User, profile?: ProfileData): AuthUser => {
  const isAdmin = profile?.role === 'admin' || user.email === 'admin@lab404.com'
  
  return {
    id: user.id,
    email: user.email!,
    name: profile?.name || user.user_metadata?.name || user.user_metadata?.full_name,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
    role: profile?.role || 'user',
    phone: profile?.phone || user.user_metadata?.phone,
    address: profile?.address,
    city: profile?.city,
    country: profile?.country || 'Lebanon',
    isAdmin,
    preferences: profile?.preferences || {}
  }
}

// =============================================
// INITIAL STATE
// =============================================

const initialState: AuthStoreState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  profileLoading: false,
  error: null,
  session: null,
  showAuthModal: false,
  authMode: 'signin'
}

// =============================================
// STORE IMPLEMENTATION
// =============================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // =============================================
        // AUTHENTICATION
        // =============================================

        signIn: async (email: string, password: string) => {
          set({ isLoading: true, error: null })

          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email.toLowerCase().trim(),
              password
            })

            if (error) {
              set({ error: error.message, isLoading: false })
              return { data: null, error: error.message }
            }

            if (data.user) {
              // Get or create profile
              let profileResponse = await db.profiles.getProfile(data.user.id)
              
              if (!profileResponse.data) {
                // Create profile for new user
                profileResponse = await db.profiles.createProfile({
                  id: data.user.id,
                  email: data.user.email!,
                  name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
                  role: data.user.email === 'admin@lab404.com' ? 'admin' : 'user'
                })
              }

              const authUser = convertSupabaseUserToAuthUser(data.user, profileResponse.data || undefined)
              
              set({
                user: authUser,
                profile: profileResponse.data,
                isAuthenticated: true,
                session: data.session,
                showAuthModal: false,
                isLoading: false,
                error: null
              })

              return { data: authUser, error: null }
            }

            set({ isLoading: false })
            return { data: null, error: 'Sign in failed' }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
            set({ error: errorMessage, isLoading: false })
            return { data: null, error: errorMessage }
          }
        },

        signUp: async (email: string, password: string, name: string) => {
          set({ isLoading: true, error: null })

          try {
            const { data, error } = await supabase.auth.signUp({
              email: email.toLowerCase().trim(),
              password,
              options: {
                data: {
                  name: name.trim(),
                  full_name: name.trim()
                }
              }
            })

            if (error) {
              set({ error: error.message, isLoading: false })
              return { data: null, error: error.message }
            }

            if (data.user) {
              // Create profile
              const profileResponse = await db.profiles.createProfile({
                id: data.user.id,
                email: data.user.email!,
                name: name.trim(),
                role: 'user'
              })

              const authUser = convertSupabaseUserToAuthUser(data.user, profileResponse.data || undefined)
              
              set({
                user: authUser,
                profile: profileResponse.data,
                isAuthenticated: true,
                session: data.session,
                showAuthModal: false,
                isLoading: false,
                error: null
              })

              return { data: authUser, error: null }
            }

            set({ isLoading: false })
            return { data: null, error: 'Sign up failed' }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
            set({ error: errorMessage, isLoading: false })
            return { data: null, error: errorMessage }
          }
        },

        signOut: async () => {
          set({ isLoading: true })

          try {
            const { error } = await supabase.auth.signOut()
            
            if (error) {
              console.error('Sign out error:', error)
            }

            // Clear all auth data regardless of API response
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              session: null,
              isLoading: false,
              error: null
            })
          } catch (error) {
            console.error('Sign out error:', error)
            // Still clear auth data on error
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              session: null,
              isLoading: false,
              error: null
            })
          }
        },

        // =============================================
        // PASSWORD MANAGEMENT
        // =============================================

        resetPassword: async (email: string) => {
          set({ isLoading: true, error: null })

          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
              redirectTo: `${window.location.origin}/reset-password`
            })

            if (error) {
              set({ error: error.message, isLoading: false })
              return { data: null, error: error.message }
            }

            set({ isLoading: false })
            return { data: true, error: null }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
            set({ error: errorMessage, isLoading: false })
            return { data: null, error: errorMessage }
          }
        },

        updatePassword: async (newPassword: string) => {
          set({ isLoading: true, error: null })

          try {
            const { error } = await supabase.auth.updateUser({
              password: newPassword
            })

            if (error) {
              set({ error: error.message, isLoading: false })
              return { data: null, error: error.message }
            }

            set({ isLoading: false })
            return { data: true, error: null }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Password update failed'
            set({ error: errorMessage, isLoading: false })
            return { data: null, error: errorMessage }
          }
        },

        // =============================================
        // PROFILE MANAGEMENT
        // =============================================

        updateProfile: async (updates: Partial<ProfileData>) => {
          const state = get()
          
          if (!state.user) {
            return { data: null, error: 'User not authenticated' }
          }

          set({ profileLoading: true, error: null })

          try {
            const response = await db.profiles.updateProfile(state.user.id, updates)

            if (response.error) {
              set({ error: response.error, profileLoading: false })
              return response
            }

            if (response.data) {
              const updatedUser = convertSupabaseUserToAuthUser(
                { ...state.session?.user, user_metadata: { ...state.session?.user?.user_metadata } },
                response.data
              )

              set({
                user: updatedUser,
                profile: response.data,
                profileLoading: false
              })
            }

            return response
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
            set({ error: errorMessage, profileLoading: false })
            return { data: null, error: errorMessage }
          }
        },

        refreshProfile: async () => {
          const state = get()
          
          if (!state.user) return

          set({ profileLoading: true })

          try {
            const response = await db.profiles.getProfile(state.user.id)
            
            if (response.data) {
              const updatedUser = convertSupabaseUserToAuthUser(
                { ...state.session?.user, user_metadata: { ...state.session?.user?.user_metadata } },
                response.data
              )

              set({
                user: updatedUser,
                profile: response.data,
                profileLoading: false
              })
            }
          } catch (error) {
            console.error('Profile refresh error:', error)
            set({ profileLoading: false })
          }
        },

        // =============================================
        // SESSION MANAGEMENT
        // =============================================

        refreshSession: async () => {
          try {
            const { data, error } = await supabase.auth.refreshSession()
            
            if (error) {
              console.error('Session refresh error:', error)
              return
            }

            if (data.session) {
              set({ session: data.session })
            }
          } catch (error) {
            console.error('Session refresh error:', error)
          }
        },

        initializeAuth: async () => {
          set({ isLoading: true })

          try {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              console.error('Session initialization error:', error)
              set({ isLoading: false, isInitialized: true })
              return
            }

            if (session?.user) {
              // Get profile
              const profileResponse = await db.profiles.getProfile(session.user.id)
              const authUser = convertSupabaseUserToAuthUser(session.user, profileResponse.data || undefined)
              
              set({
                user: authUser,
                profile: profileResponse.data,
                isAuthenticated: true,
                session,
                isLoading: false,
                isInitialized: true
              })
            } else {
              set({
                user: null,
                profile: null,
                isAuthenticated: false,
                session: null,
                isLoading: false,
                isInitialized: true
              })
            }

            // Set up auth state listener
            supabase.auth.onAuthStateChange(async (event, session) => {
              if (event === 'SIGNED_OUT' || !session) {
                set({
                  user: null,
                  profile: null,
                  isAuthenticated: false,
                  session: null
                })
              } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session.user) {
                  const profileResponse = await db.profiles.getProfile(session.user.id)
                  const authUser = convertSupabaseUserToAuthUser(session.user, profileResponse.data || undefined)
                  
                  set({
                    user: authUser,
                    profile: profileResponse.data,
                    isAuthenticated: true,
                    session
                  })
                }
              }
            })
          } catch (error) {
            console.error('Auth initialization error:', error)
            set({ isLoading: false, isInitialized: true })
          }
        },

        // =============================================
        // UI MANAGEMENT
        // =============================================

        showSignIn: () => {
          set({ showAuthModal: true, authMode: 'signin', error: null })
        },

        showSignUp: () => {
          set({ showAuthModal: true, authMode: 'signup', error: null })
        },

        showForgotPassword: () => {
          set({ showAuthModal: true, authMode: 'forgot-password', error: null })
        },

        hideAuthModal: () => {
          set({ showAuthModal: false, error: null })
        },

        // =============================================
        // UTILITY
        // =============================================

        clearErrors: () => {
          set({ error: null })
        },

        checkIsAdmin: () => {
          const state = get()
          return state.user?.isAdmin || false
        },

        // =============================================
        // INTERNAL
        // =============================================

        setUser: (user: AuthUser | null) => {
          set({
            user,
            isAuthenticated: !!user
          })
        },

        setSession: (session: any) => {
          set({ session })
        }
      }),
      {
        name: 'lab404-auth-store',
        partialize: (state) => ({
          // Only persist non-sensitive data
          authMode: state.authMode,
          // Don't persist user data or session for security
        })
      }
    ),
    { name: 'AuthStore' }
  )
)

// =============================================
// SELECTORS (PERFORMANCE OPTIMIZED)
// =============================================

export const useAuth = () => useAuthStore(state => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  isInitialized: state.isInitialized
}))

export const useAuthUser = () => useAuthStore(state => state.user)
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useIsAdmin = () => useAuthStore(state => state.user?.isAdmin || false)
export const useAuthLoading = () => useAuthStore(state => ({
  isLoading: state.isLoading,
  profileLoading: state.profileLoading
}))
export const useAuthError = () => useAuthStore(state => state.error)
export const useAuthModal = () => useAuthStore(state => ({
  showAuthModal: state.showAuthModal,
  authMode: state.authMode
}))
export const useUserProfile = () => useAuthStore(state => state.profile)

// =============================================
// UTILITY HOOKS
// =============================================

export const useAuthActions = () => useAuthStore(state => ({
  signIn: state.signIn,
  signUp: state.signUp,
  signOut: state.signOut,
  resetPassword: state.resetPassword,
  updatePassword: state.updatePassword,
  updateProfile: state.updateProfile,
  showSignIn: state.showSignIn,
  showSignUp: state.showSignUp,
  showForgotPassword: state.showForgotPassword,
  hideAuthModal: state.hideAuthModal,
  clearErrors: state.clearErrors
}))

// =============================================
// INITIALIZATION HOOK
// =============================================

export const useInitializeAuth = () => {
  const initializeAuth = useAuthStore(state => state.initializeAuth)
  const isInitialized = useAuthStore(state => state.isInitialized)
  
  return { initializeAuth, isInitialized }
}