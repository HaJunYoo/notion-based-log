import { TPost, TPosts } from 'src/types'
import { Post as SupabasePost } from 'src/libs/supabase/types'
import { getSupabaseClient } from 'src/libs/supabase'
import { getPosts as getNotionPosts } from 'src/apis/notion-client'
import {
  SyncServiceInterface,
  SyncBatch,
  SyncOperation,
  SyncResult,
  SyncConflict,
  SyncStats,
  SyncConfig,
  SyncDirection,
  ConflictResolution,
  SyncEventHandlers
} from './types'
import { DEFAULT_SYNC_CONFIG, SYNC_OPERATION_TIMEOUTS, SYNC_ERRORS } from './config'

export class SyncService implements SyncServiceInterface {
  private config: SyncConfig = { ...DEFAULT_SYNC_CONFIG }
  private eventHandlers: SyncEventHandlers = {}
  private isRunning = false

  constructor(config?: Partial<SyncConfig>, eventHandlers?: SyncEventHandlers) {
    if (config) {
      this.updateConfig(config)
    }
    if (eventHandlers) {
      this.eventHandlers = eventHandlers
    }
  }

  async syncNotionToSupabase(postIds?: string[]): Promise<SyncBatch> {
    if (this.isRunning) {
      throw new Error('Sync operation is already running')
    }

    this.isRunning = true
    const batch = this.createSyncBatch()

    try {
      this.eventHandlers.onSyncStart?.(batch)

      // Get posts from Notion
      const notionPosts = await getNotionPosts()
      const postsToSync = postIds 
        ? notionPosts.filter(post => postIds.includes(post.id))
        : notionPosts

      batch.totalOperations = postsToSync.length
      
      // Process posts in batches
      const batches = this.chunkArray(postsToSync, this.config.batchSize)
      
      for (const postBatch of batches) {
        const batchPromises = postBatch.map(post => this.syncSinglePostToSupabase(post, batch))
        await Promise.allSettled(batchPromises)
        
        this.eventHandlers.onSyncProgress?.(
          batch, 
          batch.successfulOperations + batch.failedOperations + batch.skippedOperations,
          batch.totalOperations
        )
      }

      batch.status = 'completed'
      batch.completedAt = new Date()

      this.eventHandlers.onSyncComplete?.(batch)
      return batch

    } catch (error) {
      batch.status = 'failed'
      this.eventHandlers.onSyncError?.(error as Error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  async syncSupabaseToNotion(postIds?: string[]): Promise<SyncBatch> {
    // For this blog system, Notion is the source of truth
    // This method would be implemented if we needed reverse sync
    throw new Error('Supabase to Notion sync not implemented - Notion is source of truth')
  }

  async incrementalSync(): Promise<SyncBatch> {
    const batch = this.createSyncBatch()
    
    try {
      // Get last sync timestamp from Supabase
      const lastSyncTime = await this.getLastSyncTime()
      
      // Get posts from Notion that were modified after last sync
      const notionPosts = await getNotionPosts()
      const modifiedPosts = notionPosts.filter(post => {
        const postModified = new Date(post.createdTime)
        return !lastSyncTime || postModified > lastSyncTime
      })

      if (modifiedPosts.length === 0) {
        batch.status = 'completed'
        batch.completedAt = new Date()
        return batch
      }

      // Sync only modified posts
      return await this.syncNotionToSupabase(modifiedPosts.map(p => p.id))

    } catch (error) {
      batch.status = 'failed'
      throw error
    }
  }

  async bulkSync(direction: SyncDirection): Promise<SyncBatch> {
    switch (direction) {
      case 'notion-to-supabase':
        return await this.syncNotionToSupabase()
      case 'supabase-to-notion':
        return await this.syncSupabaseToNotion()
      case 'bidirectional':
        // First sync from Notion (source of truth), then handle conflicts
        const notionToSupabase = await this.syncNotionToSupabase()
        // In a real bidirectional setup, we'd also sync the other way and resolve conflicts
        return notionToSupabase
      default:
        throw new Error(`Unsupported sync direction: ${direction}`)
    }
  }

  async resolveConflicts(conflicts: SyncConflict[]): Promise<SyncResult[]> {
    const results: SyncResult[] = []

    for (const conflict of conflicts) {
      try {
        const operation = this.createSyncOperation('update', 'notion-to-supabase', conflict.notionPost.id)
        let result: SyncResult

        switch (conflict.resolution) {
          case 'notion-wins':
            result = await this.updateSupabasePost(conflict.notionPost, operation)
            break
          case 'supabase-wins':
            result = { operation, success: true, data: conflict.supabasePost }
            break
          case 'merge':
            const mergedPost = this.mergePosts(conflict.notionPost, conflict.supabasePost)
            result = await this.updateSupabasePost(mergedPost, operation)
            break
          case 'skip':
            result = { operation: { ...operation, status: 'skipped' }, success: true }
            break
          default:
            throw new Error(`Unsupported conflict resolution: ${conflict.resolution}`)
        }

        results.push(result)
      } catch (error) {
        const operation = this.createSyncOperation('update', 'notion-to-supabase', conflict.notionPost.id)
        results.push({
          operation: { ...operation, status: 'failed' },
          success: false,
          errorMessage: (error as Error).message
        })
      }
    }

    return results
  }

  async getSyncStats(): Promise<SyncStats> {
    try {
      const supabase = getSupabaseClient()
      
      // Get total posts from Notion
      const notionPosts = await getNotionPosts()
      
      // Get synced posts from Supabase
      const { data: supabasePosts, error } = await supabase
        .from('posts')
        .select('notion_id, updated_at')

      if (error) throw error

      // Get last sync time
      const lastSyncTime = await this.getLastSyncTime()

      return {
        totalPosts: notionPosts.length,
        syncedPosts: supabasePosts?.length || 0,
        pendingPosts: notionPosts.length - (supabasePosts?.length || 0),
        failedPosts: 0, // Would need to track this in sync operations table
        lastSyncTime,
        syncDuration: 0, // Would calculate from sync batch data
        errors: []
      }
    } catch (error) {
      return {
        totalPosts: 0,
        syncedPosts: 0,
        pendingPosts: 0,
        failedPosts: 0,
        errors: [(error as Error).message]
      }
    }
  }

  async getSyncHistory(limit = 10): Promise<SyncBatch[]> {
    // In a full implementation, this would query a sync_batches table
    // For now, return empty array
    return []
  }

  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): SyncConfig {
    return { ...this.config }
  }

  // Private helper methods

  private createSyncBatch(): SyncBatch {
    return {
      id: this.generateId(),
      operations: [],
      status: 'in-progress',
      startedAt: new Date(),
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      skippedOperations: 0
    }
  }

  private createSyncOperation(
    type: 'create' | 'update' | 'delete',
    direction: SyncDirection,
    notionId: string,
    supabaseId?: string
  ): SyncOperation {
    return {
      id: this.generateId(),
      type,
      direction,
      notionId,
      supabaseId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    }
  }

  private async syncSinglePostToSupabase(post: TPost, batch: SyncBatch): Promise<SyncResult> {
    const operation = this.createSyncOperation('create', 'notion-to-supabase', post.id)
    
    try {
      operation.status = 'in-progress'
      
      // Check if post already exists in Supabase
      const existingPost = await this.findSupabasePostByNotionId(post.id)
      
      if (existingPost) {
        // Update existing post
        operation.type = 'update'
        operation.supabaseId = existingPost.id
        
        // Check for conflicts
        const hasConflict = await this.checkForConflicts(post, existingPost)
        if (hasConflict) {
          const conflict = await this.createConflict(post, existingPost)
          return await this.handleConflict(conflict, operation)
        }
        
        const result = await this.updateSupabasePost(post, operation)
        if (result.success) {
          batch.successfulOperations++
        } else {
          batch.failedOperations++
        }
        return result
      } else {
        // Create new post
        const result = await this.createSupabasePost(post, operation)
        if (result.success) {
          batch.successfulOperations++
        } else {
          batch.failedOperations++
        }
        return result
      }
      
    } catch (error) {
      operation.status = 'failed'
      operation.errorMessage = (error as Error).message
      batch.failedOperations++
      
      return {
        operation,
        success: false,
        errorMessage: (error as Error).message
      }
    }
  }

  private async createSupabasePost(post: TPost, operation: SyncOperation): Promise<SyncResult> {
    try {
      const supabase = getSupabaseClient()
      const supabasePost = this.mapNotionPostToSupabase(post)
      
      const { data, error } = await supabase
        .from('posts')
        .insert(supabasePost)
        .select()
        .single()

      if (error) throw error

      operation.status = 'completed'
      operation.supabaseId = data.id
      
      return {
        operation,
        success: true,
        data
      }
    } catch (error) {
      operation.status = 'failed'
      operation.errorMessage = (error as Error).message
      
      return {
        operation,
        success: false,
        errorMessage: (error as Error).message
      }
    }
  }

  private async updateSupabasePost(post: TPost, operation: SyncOperation): Promise<SyncResult> {
    try {
      const supabase = getSupabaseClient()
      const supabasePost = this.mapNotionPostToSupabase(post)
      
      const { data, error } = await supabase
        .from('posts')
        .update(supabasePost)
        .eq('notion_id', post.id)
        .select()
        .single()

      if (error) throw error

      operation.status = 'completed'
      
      return {
        operation,
        success: true,
        data
      }
    } catch (error) {
      operation.status = 'failed'
      operation.errorMessage = (error as Error).message
      
      return {
        operation,
        success: false,
        errorMessage: (error as Error).message
      }
    }
  }

  private async findSupabasePostByNotionId(notionId: string): Promise<SupabasePost | null> {
    try {
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('notion_id', notionId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data as SupabasePost || null
    } catch (error) {
      return null
    }
  }

  private mapNotionPostToSupabase(post: TPost): Omit<SupabasePost, 'id' | 'created_at' | 'updated_at'> {
    return {
      notion_id: post.id,
      title: post.title,
      slug: post.slug,
      content: {
        // Store the full Notion post data as JSONB
        id: post.id,
        title: post.title,
        summary: post.summary,
        tags: post.tags,
        category: post.category,
        date: post.date,
        type: post.type,
        status: post.status
      },
      status: post.status?.includes('Public') ? 'published' : 'draft',
      published_at: post.status?.includes('Public') ? new Date(post.date.start_date).toISOString() : null,
      tags: post.tags || [],
      category: post.category?.[0] || null,
      summary: post.summary || null,
      cover_image: post.thumbnail || null
    }
  }

  private async checkForConflicts(notionPost: TPost, supabasePost: SupabasePost): Promise<boolean> {
    // Simple conflict detection based on update timestamps
    const notionUpdated = new Date(notionPost.createdTime)
    const supabaseUpdated = new Date(supabasePost.updated_at)
    
    // If Supabase was updated after Notion, there might be a conflict
    return supabaseUpdated > notionUpdated
  }

  private async createConflict(notionPost: TPost, supabasePost: SupabasePost): Promise<SyncConflict> {
    return {
      notionPost,
      supabasePost,
      conflictType: 'timestamp',
      resolution: this.config.conflictResolution
    }
  }

  private async handleConflict(conflict: SyncConflict, operation: SyncOperation): Promise<SyncResult> {
    // Handle conflict based on configured resolution strategy
    if (this.eventHandlers.onConflict) {
      const resolution = await this.eventHandlers.onConflict(conflict)
      conflict.resolution = resolution
    }

    const results = await this.resolveConflicts([conflict])
    return results[0]
  }

  private mergePosts(notionPost: TPost, supabasePost: SupabasePost): TPost {
    // Simple merge strategy - prefer Notion data but keep Supabase timestamps
    return {
      ...notionPost,
      // Could add more sophisticated merging logic here
    }
  }

  private async getLastSyncTime(): Promise<Date | null> {
    try {
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('posts')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null

      return new Date(data.updated_at)
    } catch {
      return null
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const syncService = new SyncService()
export default syncService