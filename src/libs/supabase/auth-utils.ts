import { getSupabaseClient } from './index'
import { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export class AuthManager {
  private supabase = getSupabaseClient()

  // Check if current user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }

  // Check if current user has admin privileges
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false

      // Check app_metadata for admin role
      const metadata = user.app_metadata || {}
      return metadata.role === 'admin' || metadata.claims_admin === true
    } catch {
      return false
    }
  }

  // Get current user session
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return session
    } catch {
      return null
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user
    } catch {
      return null
    }
  }

  // Sign in with email and password (for future admin panel)
  async signInWithPassword(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  // Sign out current user
  async signOut() {
    return await this.supabase.auth.signOut()
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  // Generate service role client (for server-side operations)
  // Note: This should only be used on the server side with service_role key
  static createServiceClient() {
    const { CONFIG } = require('../../../site.config')
    
    if (!CONFIG.supabaseConfig.enable) {
      throw new Error('Supabase is not enabled')
    }

    // For service operations, we'd need service_role key from environment
    // This is just a placeholder - actual implementation would require server-side setup
    console.warn('Service client creation requires server-side implementation with service_role key')
    
    return null
  }
}

// Permission checking utilities
export const PermissionGuards = {
  // Check if user can read posts
  async canReadPosts(status: 'draft' | 'published' | 'archived' = 'published'): Promise<boolean> {
    if (status === 'published') return true // Public access
    
    const authManager = new AuthManager()
    return await authManager.isAuthenticated()
  },

  // Check if user can create posts
  async canCreatePosts(): Promise<boolean> {
    const authManager = new AuthManager()
    return await authManager.isAuthenticated()
  },

  // Check if user can update posts
  async canUpdatePosts(): Promise<boolean> {
    const authManager = new AuthManager()
    return await authManager.isAuthenticated()
  },

  // Check if user can delete posts
  async canDeletePosts(): Promise<boolean> {
    const authManager = new AuthManager()
    return await authManager.isAdmin()
  },

  // Check if user can manage tasks
  async canManageTasks(): Promise<boolean> {
    const authManager = new AuthManager()
    return await authManager.isAuthenticated()
  },

  // Check if user can view analytics
  async canViewAnalytics(): Promise<boolean> {
    const authManager = new AuthManager()
    return await authManager.isAdmin()
  },
}

// Error handling for auth operations
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// Auth helper functions
export const AuthHelpers = {
  // Handle auth errors consistently
  handleAuthError(error: any): AuthError {
    if (error?.message) {
      return new AuthError(error.message, error.error_code, error.status)
    }
    return new AuthError('Unknown authentication error')
  },

  // Check if error is auth related
  isAuthError(error: any): boolean {
    return error instanceof AuthError || 
           error?.message?.includes('auth') ||
           error?.status === 401 ||
           error?.status === 403
  },

  // Format auth user for display
  formatUser(user: User | null) {
    if (!user) return null
    
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      avatar: user.user_metadata?.avatar_url,
      role: user.app_metadata?.role || 'user',
      createdAt: user.created_at,
    }
  },
}

export default AuthManager