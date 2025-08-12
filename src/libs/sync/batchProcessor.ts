import { TPost, TPosts } from 'src/types'
import { getSupabaseClient } from 'src/libs/supabase'
import { getPosts as getNotionPosts } from 'src/apis/notion-client'
import { SyncBatch, SyncOperation, SyncResult } from './types'
import { timestampTracker } from './timestampTracker'
import { conflictResolver } from './conflictResolver'

export interface BatchProcessorConfig {
  batchSize: number
  maxConcurrency: number
  delayBetweenBatches: number
  enableProgressTracking: boolean
  enableConflictDetection: boolean
}

export interface BatchProgress {
  batchId: string
  totalItems: number
  processedItems: number
  successfulItems: number
  failedItems: number
  skippedItems: number
  currentBatch: number
  totalBatches: number
  startTime: Date
  estimatedCompletion?: Date
  errors: string[]
}

export class BatchProcessor {
  private config: BatchProcessorConfig
  private progressTrackers = new Map<string, BatchProgress>()

  constructor(config?: Partial<BatchProcessorConfig>) {
    this.config = {
      batchSize: 10,
      maxConcurrency: 3,
      delayBetweenBatches: 1000, // 1 second
      enableProgressTracking: true,
      enableConflictDetection: true,
      ...config
    }
  }

  async processInitialMigration(): Promise<BatchProgress> {
    const syncId = await timestampTracker.recordSyncStart('full_sync')
    const batchId = `migration_${Date.now()}`
    
    try {
      // Get all posts from Notion
      const notionPosts = await getNotionPosts()
      
      if (notionPosts.length === 0) {
        await timestampTracker.recordSyncComplete(syncId, 0)
        return this.createEmptyProgress(batchId)
      }

      // Initialize progress tracking
      const progress = this.initializeProgress(batchId, notionPosts.length)
      this.progressTrackers.set(batchId, progress)

      // Clear existing data (for clean migration)
      await this.clearSupabaseData()

      // Process in batches
      const batches = this.chunkArray(notionPosts, this.config.batchSize)
      progress.totalBatches = batches.length

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        progress.currentBatch = i + 1

        try {
          await this.processBatch(batch, progress)
          
          // Delay between batches to avoid overwhelming the API
          if (i < batches.length - 1) {
            await this.delay(this.config.delayBetweenBatches)
          }
        } catch (error) {
          const errorMsg = `Batch ${i + 1} failed: ${(error as Error).message}`
          progress.errors.push(errorMsg)
          console.error(errorMsg, error)
        }

        this.updateEstimatedCompletion(progress)
      }

      await timestampTracker.recordSyncComplete(syncId, progress.successfulItems, true)
      return progress

    } catch (error) {
      await timestampTracker.recordSyncComplete(
        syncId, 
        0, 
        false, 
        (error as Error).message
      )
      throw error
    }
  }

  async processIncrementalSync(modifiedPostIds: string[]): Promise<BatchProgress> {
    const syncId = await timestampTracker.recordSyncStart('incremental_sync')
    const batchId = `incremental_${Date.now()}`

    try {
      if (modifiedPostIds.length === 0) {
        await timestampTracker.recordSyncComplete(syncId, 0)
        return this.createEmptyProgress(batchId)
      }

      // Get modified posts from Notion
      const allNotionPosts = await getNotionPosts()
      const modifiedPosts = allNotionPosts.filter(post => 
        modifiedPostIds.includes(post.id)
      )

      // Initialize progress tracking
      const progress = this.initializeProgress(batchId, modifiedPosts.length)
      this.progressTrackers.set(batchId, progress)

      // Process in smaller batches for incremental sync
      const incrementalBatchSize = Math.min(this.config.batchSize, 5)
      const batches = this.chunkArray(modifiedPosts, incrementalBatchSize)
      progress.totalBatches = batches.length

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        progress.currentBatch = i + 1

        try {
          await this.processBatchWithConflictDetection(batch, progress)
          
          if (i < batches.length - 1) {
            await this.delay(this.config.delayBetweenBatches / 2) // Shorter delay for incremental
          }
        } catch (error) {
          const errorMsg = `Incremental batch ${i + 1} failed: ${(error as Error).message}`
          progress.errors.push(errorMsg)
        }

        this.updateEstimatedCompletion(progress)
      }

      await timestampTracker.recordSyncComplete(syncId, progress.successfulItems, true)
      return progress

    } catch (error) {
      await timestampTracker.recordSyncComplete(
        syncId, 
        0, 
        false, 
        (error as Error).message
      )
      throw error
    }
  }

  async getProgress(batchId: string): Promise<BatchProgress | null> {
    return this.progressTrackers.get(batchId) || null
  }

  async getAllActiveProgresses(): Promise<BatchProgress[]> {
    return Array.from(this.progressTrackers.values())
  }

  private async processBatch(posts: TPost[], progress: BatchProgress): Promise<void> {
    const supabase = getSupabaseClient()
    const promises: Promise<void>[] = []

    // Process posts with controlled concurrency
    for (let i = 0; i < posts.length; i += this.config.maxConcurrency) {
      const chunk = posts.slice(i, i + this.config.maxConcurrency)
      
      const chunkPromises = chunk.map(async (post) => {
        try {
          const supabasePost = this.mapNotionPostToSupabase(post)
          
          const { error } = await supabase
            .from('posts')
            .insert(supabasePost)

          if (error) {
            throw error
          }

          progress.successfulItems++
        } catch (error) {
          progress.failedItems++
          progress.errors.push(`Failed to sync ${post.title}: ${(error as Error).message}`)
        }

        progress.processedItems++
      })

      await Promise.allSettled(chunkPromises)
    }
  }

  private async processBatchWithConflictDetection(
    posts: TPost[], 
    progress: BatchProgress
  ): Promise<void> {
    const supabase = getSupabaseClient()

    for (const post of posts) {
      try {
        // Check if post exists
        const { data: existingPost } = await supabase
          .from('posts')
          .select('*')
          .eq('notion_id', post.id)
          .single()

        if (existingPost && this.config.enableConflictDetection) {
          // Detect and resolve conflicts
          const analysis = conflictResolver.analyzeConflict(post, existingPost)
          
          if (analysis.hasConflict) {
            const conflict = {
              notionPost: post,
              supabasePost: existingPost,
              conflictType: analysis.conflictTypes[0] || 'content' as const,
              resolution: analysis.recommendedResolution
            }

            const resolution = conflictResolver.resolveConflict(conflict)
            
            if (resolution.warnings.length > 0) {
              progress.errors.push(...resolution.warnings.map(w => 
                `${post.title}: ${w}`
              ))
            }

            // Update with resolved post
            const supabasePost = this.mapNotionPostToSupabase(resolution.mergedPost)
            const { error } = await supabase
              .from('posts')
              .update(supabasePost)
              .eq('notion_id', post.id)

            if (error) throw error
          } else {
            // No conflict, simple update
            const supabasePost = this.mapNotionPostToSupabase(post)
            const { error } = await supabase
              .from('posts')
              .update(supabasePost)
              .eq('notion_id', post.id)

            if (error) throw error
          }
        } else {
          // Create new post
          const supabasePost = this.mapNotionPostToSupabase(post)
          const { error } = await supabase
            .from('posts')
            .insert(supabasePost)

          if (error) throw error
        }

        progress.successfulItems++
      } catch (error) {
        progress.failedItems++
        progress.errors.push(`Failed to sync ${post.title}: ${(error as Error).message}`)
      }

      progress.processedItems++
    }
  }

  private async clearSupabaseData(): Promise<void> {
    const supabase = getSupabaseClient()
    
    // Clear existing posts for clean migration
    const { error } = await supabase
      .from('posts')
      .delete()
      .neq('id', '') // Delete all rows

    if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
      throw new Error(`Failed to clear existing data: ${error.message}`)
    }
  }

  private mapNotionPostToSupabase(post: TPost) {
    return {
      notion_id: post.id,
      title: post.title,
      slug: post.slug,
      content: {
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

  private initializeProgress(batchId: string, totalItems: number): BatchProgress {
    return {
      batchId,
      totalItems,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      skippedItems: 0,
      currentBatch: 0,
      totalBatches: 0,
      startTime: new Date(),
      errors: []
    }
  }

  private createEmptyProgress(batchId: string): BatchProgress {
    return {
      batchId,
      totalItems: 0,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      skippedItems: 0,
      currentBatch: 1,
      totalBatches: 1,
      startTime: new Date(),
      estimatedCompletion: new Date(),
      errors: []
    }
  }

  private updateEstimatedCompletion(progress: BatchProgress): void {
    if (progress.processedItems === 0) return

    const elapsedMs = Date.now() - progress.startTime.getTime()
    const avgTimePerItem = elapsedMs / progress.processedItems
    const remainingItems = progress.totalItems - progress.processedItems
    const estimatedRemainingMs = remainingItems * avgTimePerItem

    progress.estimatedCompletion = new Date(Date.now() + estimatedRemainingMs)
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const batchProcessor = new BatchProcessor()
export default batchProcessor