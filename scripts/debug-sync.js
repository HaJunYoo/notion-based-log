require('dotenv').config({ path: '.env.local' })

async function debugSync() {
  try {
    console.log('🚀 Debug sync process...')
    
    // Test Supabase with service role key
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Clear test data first
    console.log('\n🧹 Clearing test data...')
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .like('notion_id', 'test-%')
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message)
    } else {
      console.log('✅ Test data cleared')
    }
    
    // Test actual sync API call
    console.log('\n🔄 Testing sync API call...')
    const response = await fetch('http://localhost:3004/api/sync/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-secret-key-123'
      },
      body: JSON.stringify({ type: 'incremental' })
    })
    
    const result = await response.json()
    console.log('API Response:', result)
    
    // Check what actually got inserted
    console.log('\n📊 Checking database after sync...')
    const { data: posts, error } = await supabase
      .from('posts')
      .select('notion_id, title, slug, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Query failed:', error.message)
    } else {
      console.log(`✅ Found ${posts.length} posts in database:`)
      posts.forEach(post => {
        console.log(`  - ${post.title} (${post.notion_id}) - ${post.status}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message)
  }
}

debugSync()