import { NextApiRequest, NextApiResponse } from 'next'
import { WEBHOOK_CONFIG } from 'src/libs/sync/config'
import { syncService } from 'src/libs/sync/syncService'
import { WebhookPayload } from 'src/libs/sync/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook secret
    const providedSecret = req.headers[WEBHOOK_CONFIG.SECRET_HEADER] as string
    const expectedSecret = process.env.SYNC_WEBHOOK_SECRET

    if (!expectedSecret) {
      console.error('SYNC_WEBHOOK_SECRET environment variable not set')
      return res.status(500).json({ error: 'Webhook not configured' })
    }

    if (providedSecret !== expectedSecret) {
      console.error('Invalid webhook secret provided')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Parse and validate payload
    const payload = req.body as WebhookPayload

    if (!payload.event || !payload.notionId || !payload.timestamp) {
      return res.status(400).json({
        error: 'Invalid payload',
        required: ['event', 'notionId', 'timestamp']
      })
    }

    // Process webhook event
    const result = await processWebhookEvent(payload)

    res.status(200).json({
      success: true,
      event: payload.event,
      notionId: payload.notionId,
      result
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    })
  }
}

async function processWebhookEvent(payload: WebhookPayload) {
  const { event, notionId, data } = payload

  switch (event) {
    case 'post.created':
    case 'post.updated':
      // Sync the specific post from Notion to Supabase
      try {
        const batch = await syncService.syncNotionToSupabase([notionId])
        return {
          action: 'sync',
          postId: notionId,
          success: batch.successfulOperations > 0,
          operations: batch.successfulOperations,
          errors: batch.failedOperations
        }
      } catch (error) {
        console.error(`Failed to sync post ${notionId}:`, error)
        return {
          action: 'sync',
          postId: notionId,
          success: false,
          error: (error as Error).message
        }
      }

    case 'post.deleted':
      // Handle post deletion
      try {
        const result = await deleteSupabasePost(notionId)
        return {
          action: 'delete',
          postId: notionId,
          success: result
        }
      } catch (error) {
        console.error(`Failed to delete post ${notionId}:`, error)
        return {
          action: 'delete',
          postId: notionId,
          success: false,
          error: (error as Error).message
        }
      }

    default:
      throw new Error(`Unsupported event type: ${event}`)
  }
}

async function deleteSupabasePost(notionId: string): Promise<boolean> {
  try {
    const { getSupabaseServiceClient } = await import('src/libs/supabase')
    const supabase = getSupabaseServiceClient()

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('notion_id', notionId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error deleting Supabase post:', error)
    return false
  }
}

// Configure Next.js API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: WEBHOOK_CONFIG.MAX_PAYLOAD_SIZE,
    },
  },
}
