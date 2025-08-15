// Script to migrate the database schema
async function migrateSchema() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    // Use service role key if available, otherwise use anon key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    const supabase = createClient(process.env.SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('📋 Creating posts table...')
    
    // For now, let's just test if we can create tables using the REST API
    // This approach uses the PostgREST API to execute raw SQL
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS posts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            notion_id VARCHAR(255) UNIQUE NOT NULL,
            title TEXT NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            content JSONB,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
            published_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            tags TEXT[] DEFAULT '{}',
            category VARCHAR(255),
            summary TEXT,
            cover_image TEXT
          );
        `
      })
    })
    
    const result = await response.json()
    console.log('Response:', result)
    
  } catch (err) {
    console.error('❌ Error:', err.message)
    return false
  }
}

migrateSchema()
