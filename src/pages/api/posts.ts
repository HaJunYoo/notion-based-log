import type { NextApiRequest, NextApiResponse } from 'next'
import { postService } from 'src/apis/hybrid'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await postService.getPosts()
    return res.status(200).json({
      success: true,
      source: result.source,
      count: result.data.length,
      data: result.data,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to load posts',
    })
  }
}
