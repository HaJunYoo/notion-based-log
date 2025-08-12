import { NextApiRequest, NextApiResponse } from 'next'
import { syncService } from 'src/libs/sync/syncService'
import { batchProcessor } from 'src/libs/sync/batchProcessor'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Basic authentication check
    const authHeader = req.headers.authorization
    const expectedAuth = process.env.SYNC_API_SECRET
    
    if (!expectedAuth) {
      return res.status(500).json({ error: 'Sync API not configured' })
    }

    if (!authHeader || authHeader !== `Bearer ${expectedAuth}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { type = 'incremental', postIds } = req.body

    let result

    switch (type) {
      case 'full':
        // Full synchronization (initial migration)
        result = await batchProcessor.processInitialMigration()
        break

      case 'incremental':
        // Incremental sync based on timestamps
        const batch = await syncService.incrementalSync()
        result = {
          batchId: batch.id,
          totalItems: batch.totalOperations,
          processedItems: batch.totalOperations,
          successfulItems: batch.successfulOperations,
          failedItems: batch.failedOperations,
          skippedItems: batch.skippedOperations
        }
        break

      case 'specific':
        // Sync specific posts
        if (!postIds || !Array.isArray(postIds)) {
          return res.status(400).json({ 
            error: 'postIds array required for specific sync' 
          })
        }
        
        const specificBatch = await syncService.syncNotionToSupabase(postIds)
        result = {
          batchId: specificBatch.id,
          totalItems: specificBatch.totalOperations,
          processedItems: specificBatch.totalOperations,
          successfulItems: specificBatch.successfulOperations,
          failedItems: specificBatch.failedOperations,
          skippedItems: specificBatch.skippedOperations
        }
        break

      default:
        return res.status(400).json({ 
          error: 'Invalid sync type',
          allowed: ['full', 'incremental', 'specific']
        })
    }

    res.status(200).json({
      success: true,
      type,
      result
    })

  } catch (error) {
    console.error('Manual sync error:', error)
    res.status(500).json({ 
      error: 'Sync failed',
      message: (error as Error).message 
    })
  }
}