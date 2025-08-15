require('dotenv').config({ path: '.env.local' })

async function diagnoseSyncFailures() {
  try {
    console.log('🔍 Diagnosing sync failures...')

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Test direct API call to get Notion posts
    console.log('\n📚 Testing Notion API...')

    // Use a direct API call instead of importing the module
    const response = await fetch('http://localhost:3000/api/sync/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SYNC_API_SECRET || 'dev-secret-key-123'}`
      },
      body: JSON.stringify({
        type: 'specific',
        postIds: [] // This will cause an error, helping us see the sync process
      })
    })

    const result = await response.json()
    console.log('API Response for invalid request:', result)

    // Now test with incremental sync and capture more details
    console.log('\n🔄 Testing incremental sync with detailed logging...')

    // Check current database state
    const { data: currentPosts, error: queryError } = await supabase
      .from('posts')
      .select('notion_id, title, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (queryError) {
      console.error('❌ Query error:', queryError.message)
    } else {
      console.log(`📊 Current database has ${currentPosts.length} posts (showing latest 5):`)
      currentPosts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title} (${post.notion_id})`)
        console.log(`     Status: ${post.status}, Updated: ${post.updated_at}`)
      })
    }

    // Test actual sync
    console.log('\n⏳ Running incremental sync...')
    const syncResponse = await fetch('http://localhost:3000/api/sync/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SYNC_API_SECRET || 'dev-secret-key-123'}`
      },
      body: JSON.stringify({ type: 'incremental' })
    })

    const syncResult = await syncResponse.json()
    console.log('Sync Result:', JSON.stringify(syncResult, null, 2))

    // Check database state after sync
    const { data: afterSyncPosts, error: afterQueryError } = await supabase
      .from('posts')
      .select('notion_id, title, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (afterQueryError) {
      console.error('❌ After sync query error:', afterQueryError.message)
    } else {
      console.log(`\n📊 After sync database has ${afterSyncPosts.length} posts:`)
      afterSyncPosts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title} (${post.notion_id})`)
        console.log(`     Status: ${post.status}, Updated: ${post.updated_at}`)
      })
    }

    // Test a simple manual insert to see if database is working
    console.log('\n🧪 Testing manual database insert...')
    const testPost = {
      notion_id: 'diagnostic-test-' + Date.now(),
      title: 'Diagnostic Test Post',
      slug: 'diagnostic-test-' + Date.now(),
      content: {
        test: true,
        message: 'This is a diagnostic test post'
      },
      status: 'draft',
      tags: ['test', 'diagnostic'],
      category: 'Development',
      summary: 'Test post for diagnostics'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('posts')
      .insert(testPost)
      .select()

    if (insertError) {
      console.error('❌ Manual insert failed:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('✅ Manual insert successful!')
      console.log('Inserted post:', {
        id: insertData[0].id,
        title: insertData[0].title,
        notion_id: insertData[0].notion_id
      })

      // Clean up
      await supabase.from('posts').delete().eq('id', insertData[0].id)
      console.log('🧹 Cleaned up test post')
    }

  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

diagnoseSyncFailures()
