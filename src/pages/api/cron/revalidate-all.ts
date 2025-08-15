import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../../apis"

/**
 * Vercel Cron Job API for automatic site revalidation
 * Uses existing TOKEN_FOR_REVALIDATE for authentication
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Support both query parameter and Authorization header
  const { secret } = req.query
  const authHeader = req.headers.authorization
  const providedSecret = secret || authHeader?.replace('Bearer ', '')

  // Verify using existing TOKEN_FOR_REVALIDATE
  if (providedSecret !== process.env.TOKEN_FOR_REVALIDATE) {
    console.error('❌ Unauthorized cron attempt:', { 
      hasSecret: !!providedSecret,
      timestamp: new Date().toISOString()
    })
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Only allow POST requests from Vercel cron (but also support GET for manual testing)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🕐 Starting scheduled revalidation...', {
      timestamp: new Date().toISOString(),
      method: req.method,
      userAgent: req.headers['user-agent']
    })

    const startTime = Date.now()

    // Get all posts from Notion
    const posts = await getPosts()
    console.log(`📚 Found ${posts.length} posts to revalidate`)

    // Define all pages to revalidate
    const mainPages = [
      '/',           // Home page
      '/categories', // Categories page
      '/tags',       // Tags page
      '/feed.xml',   // RSS feed
      '/sitemap.xml' // Sitemap
    ]

    const results: {
      mainPages: Array<{ page: string; success: boolean; error?: string }>
      posts: Array<{ slug: string; success: boolean; error?: string }>
      errors: string[]
    } = {
      mainPages: [],
      posts: [],
      errors: []
    }

    // Revalidate main pages
    console.log('🏠 Revalidating main pages...')
    for (const page of mainPages) {
      try {
        await res.revalidate(page)
        results.mainPages.push({ page, success: true })
        console.log(`✅ Main page revalidated: ${page}`)
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error'
        results.mainPages.push({ page, success: false, error: errorMsg })
        results.errors.push(`Main page ${page}: ${errorMsg}`)
        console.error(`❌ Failed to revalidate main page ${page}:`, error)
      }
    }

    // Revalidate all post pages
    console.log('📄 Revalidating post pages...')
    for (const post of posts) {
      try {
        await res.revalidate(`/${post.slug}`)
        results.posts.push({ slug: post.slug, success: true })
        console.log(`✅ Post revalidated: /${post.slug}`)
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error'
        results.posts.push({ slug: post.slug, success: false, error: errorMsg })
        results.errors.push(`Post ${post.slug}: ${errorMsg}`)
        console.error(`❌ Failed to revalidate post /${post.slug}:`, error)
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Calculate success counts
    const mainPagesSuccess = results.mainPages.filter(r => r.success).length
    const postsSuccess = results.posts.filter(r => r.success).length
    const totalSuccess = mainPagesSuccess + postsSuccess
    const totalAttempted = mainPages.length + posts.length

    const summary = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      totalAttempted,
      totalSuccess,
      totalErrors: results.errors.length,
      mainPages: {
        total: mainPages.length,
        success: mainPagesSuccess,
        failed: mainPages.length - mainPagesSuccess
      },
      posts: {
        total: posts.length,
        success: postsSuccess,
        failed: posts.length - postsSuccess
      }
    }

    console.log('🎉 Revalidation completed:', summary)

    // Return detailed response
    return res.status(200).json({
      success: true,
      message: `Successfully revalidated ${totalSuccess}/${totalAttempted} pages`,
      ...summary,
      ...(results.errors.length > 0 && { 
        errors: results.errors.slice(0, 10) // Limit error list
      })
    })

  } catch (error: any) {
    console.error('💥 Cron job failed catastrophically:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Revalidation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
