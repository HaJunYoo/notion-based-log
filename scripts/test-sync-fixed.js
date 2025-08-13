require('dotenv').config({ path: '.env.local' })

async function testSyncFixed() {
  try {
    console.log('🔧 Testing sync with corrected implementation...')

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Test direct API call to get posts (using correct port)
    console.log('📚 Fetching posts from Notion API (port 3000)...')

    try {
      const response = await fetch('http://localhost:3000/api/posts')

      if (!response.ok) {
        console.error('❌ API call failed:', response.status, response.statusText)
        const text = await response.text()
        console.error('Response body:', text)
        return
      }

      const notionPosts = await response.json()
      console.log(`📚 Found ${notionPosts.length} posts from Notion API`)

      if (notionPosts.length === 0) {
        console.log('❌ No posts found from Notion API')
        return
      }

      // Test with first 3 posts
      const testPosts = notionPosts.slice(0, 3)

      console.log('\n🗺️  Testing mapping and database insert for first 3 posts:')

      for (let index = 0; index < testPosts.length; index++) {
        const post = testPosts[index]
        console.log(`\n--- Post ${index + 1}: ${post.title} ---`)

        // Log the original post structure
        console.log('📋 Original post data:')
        console.log({
          id: post.id,
          title: post.title?.substring(0, 50) + '...',
          slug: post.slug,
          status: post.status,
          date: post.date,
          tags: post.tags,
          category: post.category,
          summary: post.summary ? post.summary.substring(0, 50) + '...' : null,
          thumbnail: post.thumbnail,
          createdTime: post.createdTime,
          type: post.type
        })

        try {
          // Test the corrected mapping function
          const mapped = mapNotionPostToSupabaseFixed(post)
          console.log('✅ Mapping successful!')

          // Test database insert with mapped data
          const testPost = {
            ...mapped,
            notion_id: `test-fixed-${index}-${mapped.notion_id}`,
            title: `TEST FIXED ${index}: ${mapped.title}`,
            slug: `test-fixed-${index}-${mapped.slug}`
          }

          console.log('💾 Testing database insert...')
          const { data, error } = await supabase
            .from('posts')
            .insert(testPost)
            .select()

          if (error) {
            console.error(`❌ Database insert failed:`, {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })

            // Log the problematic data for debugging
            console.log('🐛 Problematic mapped data:', JSON.stringify(testPost, null, 2))

          } else {
            console.log(`✅ Database insert successful!`)
            console.log('Inserted ID:', data[0].id)

            // Clean up test data
            await supabase.from('posts').delete().eq('id', data[0].id)
            console.log('🧹 Cleaned up test data')
          }

        } catch (error) {
          console.error(`❌ Error with post ${index + 1}:`, error.message)
          console.error('Error stack:', error.stack)
        }
      }

      // If all tests pass, try a real sync operation
      if (testPosts.length > 0) {
        console.log('\n🚀 Testing actual sync service...')
        const syncResponse = await fetch('http://localhost:3000/api/sync/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SYNC_API_SECRET || 'dev-secret-key-123'}`
          },
          body: JSON.stringify({
            type: 'specific',
            postIds: [testPosts[0].id] // Test with just one post
          })
        })

        const syncResult = await syncResponse.json()
        console.log('Sync Result:', JSON.stringify(syncResult, null, 2))
      }

    } catch (fetchError) {
      console.error('❌ Failed to fetch posts:', fetchError.message)
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Fixed mapping function based on actual TPost structure
function mapNotionPostToSupabaseFixed(post) {
  try {
    // Validate required fields
    if (!post.id) {
      throw new Error('Post ID is required')
    }
    if (!post.title) {
      throw new Error('Post title is required')
    }
    if (!post.slug) {
      throw new Error('Post slug is required')
    }

    // Safe date handling - TPost has date: { start_date: string }
    let publishedAt = null
    if (post.status?.includes('Public') && post.date?.start_date) {
      try {
        publishedAt = new Date(post.date.start_date).toISOString()
      } catch (dateError) {
        console.warn(`Invalid date for post ${post.id}: ${post.date.start_date}`)
        publishedAt = null
      }
    }

    // Handle status array - TPostStatus[]
    const statusArray = Array.isArray(post.status) ? post.status : []
    const isPublic = statusArray.some(status => status.includes('Public'))

    return {
      notion_id: post.id,
      title: post.title,
      slug: post.slug,
      content: {
        id: post.id,
        title: post.title,
        summary: post.summary || null,
        tags: post.tags || [],
        category: post.category || [],
        date: post.date || null,
        type: post.type || [],
        status: post.status || [],
        createdTime: post.createdTime,
        fullWidth: post.fullWidth
      },
      status: isPublic ? 'published' : 'draft',
      published_at: publishedAt,
      tags: Array.isArray(post.tags) ? post.tags : [],
      category: Array.isArray(post.category) && post.category.length > 0 ? post.category[0] : null,
      summary: post.summary || null,
      cover_image: post.thumbnail || null
    }
  } catch (error) {
    console.error('Mapping error for post:', {
      id: post.id,
      title: post.title,
      error: error.message
    })
    throw error
  }
}

testSyncFixed()
