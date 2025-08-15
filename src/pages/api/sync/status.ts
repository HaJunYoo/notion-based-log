import { NextApiRequest, NextApiResponse } from 'next'
import { syncService } from 'src/libs/sync/syncService'
import { batchProcessor } from 'src/libs/sync/batchProcessor'
import { timestampTracker } from 'src/libs/sync/timestampTracker'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow GET requests for status
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Basic authentication check
    const authHeader = req.headers.authorization
    const expectedAuth = process.env.SYNC_API_SECRET
    
    if (expectedAuth && (!authHeader || authHeader !== `Bearer ${expectedAuth}`)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { batchId } = req.query

    if (batchId && typeof batchId === 'string') {
      // Get specific batch progress
      const progress = await batchProcessor.getProgress(batchId)
      
      if (!progress) {
        return res.status(404).json({ error: 'Batch not found' })
      }

      return res.status(200).json({
        success: true,
        batch: progress
      })
    }

    // Get overall sync status
    const [stats, history, activeProgresses] = await Promise.all([
      syncService.getSyncStats(),
      timestampTracker.getSyncHistory(5),
      batchProcessor.getAllActiveProgresses()
    ])

    res.status(200).json({
      success: true,
      stats,
      history,
      activeProgresses,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Sync status error:', error)
    res.status(500).json({ 
      error: 'Failed to get sync status',
      message: (error as Error).message 
    })
  }
}