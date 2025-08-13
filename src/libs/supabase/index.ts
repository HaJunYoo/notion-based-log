import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../../../site.config'

let supabaseInstance: ReturnType<typeof createClient> | null = null
let supabaseServiceInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!CONFIG.supabaseConfig.enable) {
    throw new Error('Supabase is not enabled. Please configure SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
  }

  if (!supabaseInstance) {
    const { url, anonKey } = CONFIG.supabaseConfig

    if (!url || !anonKey) {
      throw new Error('Missing Supabase configuration in site.config.js')
    }

    supabaseInstance = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Since this is SSG/SSR, we don't need session persistence
        detectSessionInUrl: false, // Disable automatic session detection from URL
        flowType: 'pkce', // Use PKCE flow for better security
      },
      db: {
        schema: 'public' as any,
      },
      global: {
        headers: {
          'x-client-info': 'notion-based-log@1.0.0',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 2, // Limit realtime events for performance
        },
      },
    })
  }

  return supabaseInstance
}

/**
 * Server-only Supabase client using the service role key for privileged operations
 * NOTE: Never expose this client to the browser. It must only be used in API routes or server code.
 */
export function getSupabaseServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServiceClient can only be used on the server')
  }

  const url = CONFIG.supabaseConfig.url
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  }

  if (!supabaseServiceInstance) {
    supabaseServiceInstance = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public' as any,
      },
      global: {
        headers: {
          'x-client-info': 'notion-based-log-admin@1.0.0',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })
  }

  return supabaseServiceInstance
}

// For backward compatibility
export const supabase = getSupabaseClient()

export default supabase
