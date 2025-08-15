import type { NextApiRequest, NextApiResponse } from 'next'
import { postService } from 'src/apis/hybrid'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' })
  }

  try {
    const result = await postService.getPostDetail(slug)
    
    // Cache headers for performance
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    
    return res.status(200).json({
      success: true,
      source: result.source,
      data: result.data,
    })
  } catch (error: any) {
    console.error(`Failed to fetch post detail for slug: ${slug}`, error)
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to load post detail',
    })
  }
}