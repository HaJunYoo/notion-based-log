import { getSupabaseClient } from 'src/libs/supabase'

export interface SyncTimestamp {
  id: string
  operation_type: 'full_sync' | 'incremental_sync' | 'manual_sync'
  direction: 'notion-to-supabase' | 'supabase-to-notion'
  started_at: string
  completed_at?: string
  posts_synced: number
  status: 'completed' | 'failed' | 'in_progress'
  error_message?: string
}

export class TimestampTracker {
  private static instance: TimestampTracker
  
  private constructor() {}
  
  static getInstance(): TimestampTracker {
    if (!TimestampTracker.instance) {
      TimestampTracker.instance = new TimestampTracker()
    }
    return TimestampTracker.instance
  }

  async recordSyncStart(
    operationType: 'full_sync' | 'incremental_sync' | 'manual_sync',
    direction: 'notion-to-supabase' | 'supabase-to-notion' = 'notion-to-supabase'
  ): Promise<string> {
    const supabase = getSupabaseClient()
    const syncId = this.generateSyncId()
    
    const timestamp = {
      id: syncId,
      operation_type: operationType,
      direction,
      started_at: new Date().toISOString(),
      posts_synced: 0,
      status: 'in_progress' as const
    }

    // Store in localStorage as fallback since we don't have sync_timestamps table yet
    this.storeLocalTimestamp(syncId, timestamp)
    
    // TODO: When sync_timestamps table is created, store in Supabase
    // const { error } = await supabase
    //   .from('sync_timestamps')
    //   .insert(timestamp)
    // 
    // if (error) throw error
    
    return syncId
  }

  async recordSyncComplete(
    syncId: string, 
    postsSynced: number, 
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const timestamp = this.getLocalTimestamp(syncId)
    if (!timestamp) return

    const updatedTimestamp: SyncTimestamp = {
      ...timestamp,
      completed_at: new Date().toISOString(),
      posts_synced: postsSynced,
      status: success ? 'completed' : 'failed',
      error_message: errorMessage
    }

    this.storeLocalTimestamp(syncId, updatedTimestamp)

    // TODO: Update in Supabase when table exists
    // const supabase = getSupabaseClient()
    // const { error } = await supabase
    //   .from('sync_timestamps')
    //   .update({
    //     completed_at: updatedTimestamp.completed_at,
    //     posts_synced: postsSynced,
    //     status: updatedTimestamp.status,
    //     error_message: errorMessage
    //   })
    //   .eq('id', syncId)
  }

  async getLastSyncTime(
    operationType?: 'full_sync' | 'incremental_sync' | 'manual_sync'
  ): Promise<Date | null> {
    try {
      // Get from localStorage for now
      const timestamps = this.getAllLocalTimestamps()
      const completedTimestamps = timestamps.filter(t => 
        t.status === 'completed' && 
        (!operationType || t.operation_type === operationType)
      )

      if (completedTimestamps.length === 0) return null

      const latest = completedTimestamps.sort((a, b) => 
        new Date(b.completed_at || b.started_at).getTime() - 
        new Date(a.completed_at || a.started_at).getTime()
      )[0]

      return new Date(latest.completed_at || latest.started_at)

      // TODO: Query from Supabase when table exists
      // const supabase = getSupabaseClient()
      // const query = supabase
      //   .from('sync_timestamps')
      //   .select('completed_at, started_at')
      //   .eq('status', 'completed')
      //   .order('completed_at', { ascending: false })
      //   .limit(1)

      // if (operationType) {
      //   query.eq('operation_type', operationType)
      // }

      // const { data, error } = await query.single()
      // if (error || !data) return null

      // return new Date(data.completed_at || data.started_at)
    } catch (error) {
      console.error('Error getting last sync time:', error)
      return null
    }
  }

  async getSyncHistory(limit: number = 10): Promise<SyncTimestamp[]> {
    // Get from localStorage for now
    const timestamps = this.getAllLocalTimestamps()
    return timestamps
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, limit)

    // TODO: Query from Supabase when table exists
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('sync_timestamps')
    //   .select('*')
    //   .order('started_at', { ascending: false })
    //   .limit(limit)

    // if (error) throw error
    // return data || []
  }

  async getModifiedPostsSince(lastSyncTime: Date): Promise<string[]> {
    // This would ideally query Notion API for posts modified since timestamp
    // For now, we'll check Supabase for posts that might be newer
    try {
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('posts')
        .select('notion_id, updated_at')
        .gt('updated_at', lastSyncTime.toISOString())

      if (error) throw error

      return data?.map(post => String(post.notion_id)) || []
    } catch (error) {
      console.error('Error getting modified posts:', error)
      return []
    }
  }

  async cleanupOldTimestamps(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Clean up memory storage
    const timestamps = this.getAllLocalTimestamps()
    const filtered = timestamps.filter(t => 
      new Date(t.started_at) > cutoffDate
    )
    
    // Clear and repopulate memory storage
    this.memoryStorage.clear()
    filtered.forEach(t => this.memoryStorage.set(t.id, t))

    // TODO: Clean up Supabase when table exists
    // const supabase = getSupabaseClient()
    // const { error } = await supabase
    //   .from('sync_timestamps')
    //   .delete()
    //   .lt('started_at', cutoffDate.toISOString())
  }

  // Private helper methods for in-memory storage (server-side compatible)
  private memoryStorage = new Map<string, SyncTimestamp>()

  private storeLocalTimestamp(syncId: string, timestamp: Partial<SyncTimestamp>): void {
    const existing = this.memoryStorage.get(syncId)
    
    if (existing) {
      this.memoryStorage.set(syncId, { ...existing, ...timestamp })
    } else {
      this.memoryStorage.set(syncId, timestamp as SyncTimestamp)
    }
  }

  private getLocalTimestamp(syncId: string): SyncTimestamp | null {
    return this.memoryStorage.get(syncId) || null
  }

  private getAllLocalTimestamps(): SyncTimestamp[] {
    return Array.from(this.memoryStorage.values())
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const timestampTracker = TimestampTracker.getInstance()
export default timestampTracker