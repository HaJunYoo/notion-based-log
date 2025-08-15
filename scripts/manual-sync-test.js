require('dotenv').config({ path: '.env.local' })

async function manualSyncTest() {
  try {
    console.log('🚀 Manual sync test...')
    
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Create a sample post that mimics Notion structure
    const samplePost = {
      notion_id: 'manual-test-' + Date.now(),
      title: 'Manual Test Post from Notion',
      slug: 'manual-test-post-' + Date.now(),
      content: {
        blocks: [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{ plain_text: 'This is a test post from manual sync.' }]
            }
          }
        ]
      },
      status: 'published',
      published_at: new Date().toISOString(),
      tags: ['test', 'manual', 'sync'],
      category: 'Development',
      summary: 'Test post for manual sync verification',
      cover_image: null
    }
    
    console.log('📝 Inserting sample post...')
    const { data, error } = await supabase
      .from('posts')
      .insert(samplePost)
      .select()
    
    if (error) {
      console.error('❌ Insert failed:', error.message)
    } else {
      console.log('✅ Manual insert successful!')
      console.log('Post ID:', data[0].id)
      console.log('Title:', data[0].title)
      console.log('Status:', data[0].status)
    }
    
    // Check total count
    const { data: countData, error: countError } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
    
    if (!countError) {
      console.log(`📊 Total posts in database: ${countData.length}`)
    }
    
  } catch (error) {
    console.error('💥 Manual sync test failed:', error.message)
  }
}

manualSyncTest()