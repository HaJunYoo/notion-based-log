import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify the secret token
    const secret = req.headers.authorization?.replace('Bearer ', '') || req.body.secret
    const expectedSecret = process.env.REVALIDATION_SECRET
    
    if (!expectedSecret) {
      console.error('REVALIDATION_SECRET environment variable not set')
      return res.status(500).json({ error: 'Revalidation not configured' })
    }

    if (secret !== expectedSecret) {
      console.error('Invalid revalidation secret provided')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { slug, paths } = req.body

    // Validate input
    if (!slug && !paths) {
      return res.status(400).json({ 
        error: 'Either slug or paths array is required',
        usage: {
          single: { slug: 'post-slug' },
          multiple: { paths: ['/post-1', '/post-2', '/'] }
        }
      })
    }

    const pathsToRevalidate: string[] = []

    if (slug) {
      // Revalidate specific post
      pathsToRevalidate.push(`/${slug}`)
      // Also revalidate the homepage as it might contain this post
      pathsToRevalidate.push('/')
    }

    if (paths && Array.isArray(paths)) {
      pathsToRevalidate.push(...paths)
    }

    // Remove duplicates
    const uniquePaths = [...new Set(pathsToRevalidate)]

    // Perform revalidation
    const revalidationResults = []
    for (const path of uniquePaths) {
      try {
        await res.revalidate(path)
        revalidationResults.push({ path, success: true })
        console.log(`Successfully revalidated: ${path}`)
      } catch (error) {
        revalidationResults.push({ 
          path, 
          success: false, 
          error: (error as Error).message 
        })
        console.error(`Failed to revalidate ${path}:`, error)
      }
    }

    const successCount = revalidationResults.filter(r => r.success).length
    const failureCount = revalidationResults.length - successCount

    return res.status(200).json({
      success: failureCount === 0,
      message: `Revalidated ${successCount}/${revalidationResults.length} paths`,
      results: revalidationResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Revalidation error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    })
  }
}

// Example usage:
// POST /api/revalidate-post
// Headers: { "Authorization": "Bearer your-secret-token" }
// Body: { "slug": "my-post-slug" }
//
// or
//
// Body: { "paths": ["/", "/my-post", "/another-post"] }