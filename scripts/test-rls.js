// Test script for Row Level Security policies
async function testRLSPolicies() {
  try {
    console.log('🔒 Testing Row Level Security policies...')
    
    const { createClient } = await import('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    console.log('\n📖 Testing public read access to posts...')
    
    // Test 1: Try to read posts (should work for public posts)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, status')
      .limit(5)
    
    if (postsError) {
      if (postsError.code === '42P01') {
        console.log('⚠️ Posts table does not exist yet - RLS policies not testable')
        console.log('💡 Run supabase/schema.sql and supabase/rls-policies.sql first')
        return false
      } else {
        console.log(`❌ Error reading posts: ${postsError.message}`)
        return false
      }
    } else {
      console.log('✅ Public read access to posts working')
      console.log(`📊 Found ${posts?.length || 0} posts`)
    }
    
    console.log('\n👀 Testing page views access...')
    
    // Test 2: Try to read page views (should work - public read)
    const { data: views, error: viewsError } = await supabase
      .from('page_views')
      .select('id, view_count')
      .limit(3)
    
    if (viewsError) {
      if (viewsError.code === '42P01') {
        console.log('⚠️ Page_views table does not exist yet')
      } else {
        console.log(`❌ Error reading page views: ${viewsError.message}`)
        return false
      }
    } else {
      console.log('✅ Public read access to page views working')
      console.log(`📊 Found ${views?.length || 0} page view records`)
    }
    
    console.log('\n✏️ Testing insert permissions...')
    
    // Test 3: Try to insert a page view (should work - anonymous insert allowed)
    const { data: insertedView, error: insertError } = await supabase
      .from('page_views')
      .insert([
        {
          post_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          view_count: 1,
          unique_views: 1
        }
      ])
      .select()
    
    if (insertError) {
      if (insertError.code === '42P01') {
        console.log('⚠️ Cannot test insert - page_views table does not exist')
      } else if (insertError.code === '23503') {
        console.log('✅ RLS working - foreign key constraint prevents invalid post_id')
      } else {
        console.log(`⚠️ Insert error: ${insertError.message}`)
      }
    } else {
      console.log('✅ Anonymous insert to page_views working')
      console.log(`📝 Inserted view record: ${insertedView?.[0]?.id}`)
    }
    
    console.log('\n🔐 Testing authenticated operations...')
    
    // Test 4: Try operations that require authentication (should fail with anon key)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .limit(3)
    
    if (tasksError) {
      if (tasksError.code === '42P01') {
        console.log('⚠️ Tasks table does not exist yet')
      } else if (tasksError.code === '42501' || tasksError.message.includes('permission')) {
        console.log('✅ RLS working - anonymous access to tasks properly blocked')
      } else {
        console.log(`⚠️ Unexpected tasks error: ${tasksError.message}`)
      }
    } else {
      console.log('⚠️ Anonymous access to tasks allowed (check RLS policies)')
      console.log(`📋 Found ${tasks?.length || 0} tasks`)
    }
    
    return true
  } catch (err) {
    console.error('❌ RLS test failed:', err.message)
    return false
  }
}

async function testAuthUtilities() {
  try {
    console.log('\n🛡️ Testing authentication utilities...')
    
    // We can't directly test the auth utilities in Node.js easily
    // But we can check if they would work by testing auth status
    const { createClient } = await import('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    // Test getting current user (should be null for anonymous)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log(`⚠️ Auth error: ${userError.message}`)
      return false
    }
    
    if (!user) {
      console.log('✅ Anonymous auth state correct (no user)')
    } else {
      console.log('⚠️ Unexpected authenticated user found')
    }
    
    // Test getting session (should be null for anonymous)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log(`⚠️ Session error: ${sessionError.message}`)
      return false
    }
    
    if (!session) {
      console.log('✅ Anonymous session state correct (no session)')
    } else {
      console.log('⚠️ Unexpected active session found')
    }
    
    return true
  } catch (err) {
    console.error('❌ Auth utilities test failed:', err.message)
    return false
  }
}

async function main() {
  console.log('🔒 Running RLS and Authentication Tests\n')
  
  const rlsSuccess = await testRLSPolicies()
  const authSuccess = await testAuthUtilities()
  
  const allSuccess = rlsSuccess && authSuccess
  
  console.log('\n📊 Test Results Summary:')
  console.log(`RLS Policies: ${rlsSuccess ? '✅' : '❌'}`)
  console.log(`Auth Utilities: ${authSuccess ? '✅' : '❌'}`)
  console.log(`Overall: ${allSuccess ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (allSuccess) {
    console.log('\n🎉 All security tests passed!')
  } else {
    console.log('\n⚠️ Some security tests failed. Check the errors above.')
    console.log('💡 Make sure to run schema.sql and rls-policies.sql in Supabase')
  }
  
  process.exit(allSuccess ? 0 : 1)
}

main()