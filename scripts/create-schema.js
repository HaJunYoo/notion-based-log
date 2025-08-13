// Script to create the database schema
async function createSchema() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const fs = require('fs')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('📋 Creating database schema...')
    
    // Read the schema file
    const schemaSQL = fs.readFileSync('supabase/schema.sql', 'utf8')
    
    // Execute the schema SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    
    if (error) {
      console.error('❌ Schema creation failed:', error.message)
      return false
    }
    
    console.log('✅ Schema created successfully!')
    return true
    
  } catch (err) {
    console.error('❌ Error:', err.message)
    return false
  }
}

createSchema()
