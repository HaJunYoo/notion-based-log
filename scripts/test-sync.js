const { syncService } = require('../src/libs/sync/syncService')

async function testSync() {
  console.log('🔄 Starting Notion → Supabase sync test...')
  
  try {
    // Test sync stats first
    console.log('📊 Getting current sync stats...')
    const stats = await syncService.getSyncStats()
    console.log('Current stats:', {
      totalPosts: stats.totalPosts,
      syncedPosts: stats.syncedPosts,
      pendingPosts: stats.pendingPosts
    })

    // Perform incremental sync
    console.log('🔄 Performing incremental sync...')
    const result = await syncService.incrementalSync()
    
    console.log('✅ Sync completed:', {
      batchId: result.id,
      totalOperations: result.totalOperations,
      successful: result.successfulOperations,
      failed: result.failedOperations,
      status: result.status
    })

    // Get updated stats
    console.log('📊 Getting updated sync stats...')
    const updatedStats = await syncService.getSyncStats()
    console.log('Updated stats:', {
      totalPosts: updatedStats.totalPosts,
      syncedPosts: updatedStats.syncedPosts,
      pendingPosts: updatedStats.pendingPosts
    })

  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error(error.stack)
  }
}

testSync()