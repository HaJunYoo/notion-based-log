import { TPost } from 'src/types'
import { Post as SupabasePost } from 'src/libs/supabase/types'

export type SyncDirection = 'notion-to-supabase' | 'supabase-to-notion' | 'bidirectional'

export type SyncStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped'

export type ConflictResolution = 'notion-wins' | 'supabase-wins' | 'merge' | 'skip'

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  direction: SyncDirection
  notionId: string
  supabaseId?: string
  status: SyncStatus
  createdAt: Date
  updatedAt: Date
  errorMessage?: string
  retryCount: number
  maxRetries: number
}

export interface SyncResult {
  operation: SyncOperation
  success: boolean
  errorMessage?: string
  data?: any
}

export interface SyncBatch {
  id: string
  operations: SyncOperation[]
  status: SyncStatus
  startedAt: Date
  completedAt?: Date
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  skippedOperations: number
}

export interface SyncConflict {
  notionPost: TPost
  supabasePost: SupabasePost
  conflictType: 'content' | 'metadata' | 'timestamp'
  resolution: ConflictResolution
  resolvedAt?: Date
  resolvedBy?: 'auto' | 'manual'
}

export interface SyncConfig {
  batchSize: number
  maxRetries: number
  retryDelay: number
  conflictResolution: ConflictResolution
  enableRealTimeSync: boolean
  syncInterval: number // in milliseconds
  includeMetadata: boolean
  includeTags: boolean
  includeCategories: boolean
}

export interface SyncStats {
  totalPosts: number
  syncedPosts: number
  pendingPosts: number
  failedPosts: number
  lastSyncTime?: Date
  nextSyncTime?: Date
  syncDuration?: number
  errors: string[]
}

export interface WebhookPayload {
  event: 'post.created' | 'post.updated' | 'post.deleted'
  notionId: string
  timestamp: Date
  data?: TPost
}

export interface SyncServiceInterface {
  // Core sync operations
  syncNotionToSupabase(postIds?: string[]): Promise<SyncBatch>
  syncSupabaseToNotion(postIds?: string[]): Promise<SyncBatch>
  
  // Incremental sync
  incrementalSync(): Promise<SyncBatch>
  
  // Batch operations
  bulkSync(direction: SyncDirection): Promise<SyncBatch>
  
  // Conflict resolution
  resolveConflicts(conflicts: SyncConflict[]): Promise<SyncResult[]>
  
  // Status and monitoring
  getSyncStats(): Promise<SyncStats>
  getSyncHistory(limit?: number): Promise<SyncBatch[]>
  
  // Configuration
  updateConfig(config: Partial<SyncConfig>): void
  getConfig(): SyncConfig
}

export interface SyncEventHandlers {
  onSyncStart?: (batch: SyncBatch) => void
  onSyncProgress?: (batch: SyncBatch, completed: number, total: number) => void
  onSyncComplete?: (batch: SyncBatch) => void
  onSyncError?: (error: Error, operation?: SyncOperation) => void
  onConflict?: (conflict: SyncConflict) => ConflictResolution | Promise<ConflictResolution>
}