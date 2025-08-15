import { NextApiRequest, NextApiResponse } from "next"

/**
 * Simple status check API for cron job health monitoring
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { secret } = req.query

  if (secret !== process.env.TOKEN_FOR_REVALIDATE) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Simple status check
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasNotionConfig: !!process.env.NOTION_PAGE_ID,
    hasRevalidateToken: !!process.env.TOKEN_FOR_REVALIDATE,
    cronJobEndpoint: '/api/cron/revalidate-all',
    schedule: '0 2 * * * (daily at 2 AM)'
  })
}
