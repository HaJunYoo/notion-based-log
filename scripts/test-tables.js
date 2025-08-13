// Test script to check what tables exist
async function checkTables() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    console.log('📋 Checking existing tables...')
    
    // Test posts table
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
    
    if (!postsError) {
      console.log('✅ posts table exists')
    } else if (postsError.code === '42P01') {
      console.log('❌ posts table not found')
    } else {
      console.log('⚠️ posts table error:', postsError.message)
    }
    
    // Test tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (!tasksError) {
      console.log('✅ tasks table exists')
    } else if (tasksError.code === '42P01') {
      console.log('❌ tasks table not found')
    } else {
      console.log('⚠️ tasks table error:', tasksError.message)
    }
    
    // Test page_views table
    const { data: pageViews, error: pageViewsError } = await supabase
      .from('page_views')
      .select('*')
      .limit(1)
    
    if (!pageViewsError) {
      console.log('✅ page_views table exists')
    } else if (pageViewsError.code === '42P01') {
      console.log('❌ page_views table not found')
    } else {
      console.log('⚠️ page_views table error:', pageViewsError.message)
    }
    
  } catch (err) {
    console.error('❌ Error checking tables:', err.message)
  }
}

checkTables()
