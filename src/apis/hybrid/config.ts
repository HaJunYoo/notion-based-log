import { CONFIG } from '../../../site.config'
import { HybridServiceConfig, FallbackStrategy } from './types'

export const HYBRID_SERVICE_CONFIG: HybridServiceConfig = {
  enableSupabase: CONFIG.supabaseConfig.enable,
  enableNotion: true, // Notion is always available as fallback
  fallbackToNotion: true,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheTimeout: 300000, // 5 minutes in milliseconds
}

export const DEFAULT_FALLBACK_STRATEGY: FallbackStrategy = {
  primarySource: CONFIG.supabaseConfig.enable ? 'supabase' : 'notion',
  fallbackSource: 'notion',
  conditions: {
    onError: true,
    onTimeout: true,
    onUnavailable: true,
  },
}

export const CACHE_KEYS = {
  POSTS: 'hybrid:posts',
  POST: (id: string) => `hybrid:post:${id}`,
  HEALTH: (source: string) => `hybrid:health:${source}`,
} as const