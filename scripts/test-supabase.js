// Simple test script to check if Supabase is accessible
async function testSupabase() {
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
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test connection with a simple query
    const { error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      console.log('\nNote: This error is expected if database tables haven\'t been created yet.')
      console.log('Run the schema.sql file in your Supabase SQL Editor to create the tables.')
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return false
  }
}

async function main() {
  const success = await testSupabase()
  process.exit(success ? 0 : 1)
}

main()