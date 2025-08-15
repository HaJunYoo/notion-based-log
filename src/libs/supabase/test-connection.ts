import { supabase } from './index'

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log(`Posts table exists and is accessible`)
    return true
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err)
    return false
  }
}

export async function testDatabaseSchema() {
  try {
    console.log('Testing database schema...')
    
    // Test all tables exist
    const tables = ['posts', 'tasks', 'page_views']
    const results = []
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
        
        if (error) {
          console.error(`❌ Table '${table}' test failed:`, error.message)
          results.push({ table, success: false, error: error.message })
        } else {
          console.log(`✅ Table '${table}' is accessible`)
          results.push({ table, success: true })
        }
      } catch (err) {
        console.error(`❌ Table '${table}' test error:`, err)
        results.push({ table, success: false, error: err })
      }
    }
    
    const allSuccess = results.every(r => r.success)
    console.log(allSuccess ? '✅ All database tables are accessible' : '❌ Some database tables have issues')
    
    return { success: allSuccess, results }
  } catch (err) {
    console.error('❌ Schema test failed:', err)
    return { success: false, error: err }
  }
}

export async function runAllTests() {
  console.log('🔧 Running Supabase integration tests...\n')
  
  const connectionTest = await testSupabaseConnection()
  if (!connectionTest) {
    console.log('\n❌ Connection test failed - stopping here')
    return false
  }
  
  const schemaTest = await testDatabaseSchema()
  
  console.log('\n📊 Test Summary:')
  console.log(`Connection: ${connectionTest ? '✅' : '❌'}`)
  console.log(`Schema: ${schemaTest.success ? '✅' : '❌'}`)
  
  return connectionTest && schemaTest.success
}