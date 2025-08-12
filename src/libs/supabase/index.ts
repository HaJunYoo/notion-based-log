import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../../../site.config'

let supabaseInstance: ReturnType<typeof createClient> | null = null

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
      },
      db: {
        schema: 'public' as any,
      },
    })
  }

  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabaseClient()

export default supabase