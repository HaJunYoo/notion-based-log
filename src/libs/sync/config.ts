import { SyncConfig } from './types'

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  batchSize: 10,
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  conflictResolution: 'notion-wins', // Notion is source of truth
  enableRealTimeSync: false, // Disabled by default for safety
  syncInterval: 300000, // 5 minutes
  includeMetadata: true,
  includeTags: true,
  includeCategories: true,
}

export const SYNC_OPERATION_TIMEOUTS = {
  CREATE: 30000, // 30 seconds
  UPDATE: 20000, // 20 seconds
  DELETE: 10000, // 10 seconds
  BATCH: 300000, // 5 minutes
} as const

export const WEBHOOK_CONFIG = {
  SECRET_HEADER: 'x-sync-secret',
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const

export const SYNC_ERRORS = {
  NOTION_API_ERROR: 'NOTION_API_ERROR',
  SUPABASE_ERROR: 'SUPABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const

export const SYNC_TABLES = {
  SYNC_OPERATIONS: 'sync_operations',
  SYNC_BATCHES: 'sync_batches',
  SYNC_CONFLICTS: 'sync_conflicts',
} as const