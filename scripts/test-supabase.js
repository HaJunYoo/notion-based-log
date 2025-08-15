// Enhanced test script to check Supabase client configuration
async function testSupabaseConnection() {
  try {
    // Import dynamically to handle ES modules
    const { createClient } = await import('@supabase/supabase-js')
    
    // Load environment variables
    require('dotenv').config({ path: '.env.local' })
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables')
      console.log('Please check .env.local contains:')
      console.log('- SUPABASE_URL')
      console.log('- SUPABASE_ANON_KEY')
      return false
    }
    
    console.log('🔧 Testing Supabase connection...')
    console.log(`URL: ${supabaseUrl}`)
    
    // Create client with enhanced configuration
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'notion-based-log@1.0.0',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })
    
    console.log('⚙️ Client configuration applied')
    
    // Test basic connection with timeout
    const connectionTest = Promise.race([
      supabase.from('posts').select('count', { count: 'exact', head: true }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ])
    
    const { error } = await connectionTest
    
    if (error) {
      if (error.code === '42P01') {
        console.log('✅ Connection successful (tables not created yet)')
        console.log('💡 Run supabase/schema.sql to create tables')
        return true
      }
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection and configuration successful!')
    return true
  } catch (err) {
    if (err.message === 'Connection timeout') {
      console.error('❌ Connection timeout - check network and URL')
    } else {
      console.error('❌ Test failed:', err.message)
    }
    return false
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing health check functionality...')
    
    // We can't directly import the health check due to ES modules complexity
    // So we'll simulate the health check logic
    const { createClient } = await import('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    const startTime = Date.now()
    const { error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true })
      .limit(1)
    
    const latency = Date.now() - startTime
    
    console.log(`⚡ Response latency: ${latency}ms`)
    
    if (error && error.code === '42P01') {
      console.log('✅ Health check: Healthy (connection OK, tables pending)')
      return true
    } else if (!error) {
      console.log('✅ Health check: Healthy (full functionality)')
      return true
    } else {
      console.log('⚠️ Health check: Issues detected')
      console.log(`Error: ${error.message}`)
      return false
    }
  } catch (err) {
    console.error('❌ Health check failed:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Running Enhanced Supabase Tests\n')
  
  const connectionSuccess = await testSupabaseConnection()
  const healthSuccess = await testHealthCheck()
  
  const allSuccess = connectionSuccess && healthSuccess
  
  console.log('\n📊 Test Results Summary:')
  console.log(`Connection Test: ${connectionSuccess ? '✅' : '❌'}`)
  console.log(`Health Check: ${healthSuccess ? '✅' : '❌'}`)
  console.log(`Overall: ${allSuccess ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (allSuccess) {
    console.log('\n🎉 All tests passed! Supabase client is properly configured.')
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.')
  }
  
  process.exit(allSuccess ? 0 : 1)
}

main()