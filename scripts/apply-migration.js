// Script to apply migration manually using individual queries
async function applyMigration() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    console.log('🚀 Applying database migration...')
    
    console.log('❌ Direct table creation not possible with anon key')
    console.log('💡 You need to either:')
    console.log('   1. Use Supabase Dashboard to run the SQL from supabase/schema.sql')
    console.log('   2. Use Supabase CLI: supabase db push')
    console.log('   3. Set up service role key for programmatic access')
    console.log('')
    console.log('📋 To apply manually via dashboard:')
    console.log('   1. Go to ' + process.env.SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/') + '/sql')
    console.log('   2. Copy and paste the contents of supabase/schema.sql')
    console.log('   3. Click Run to execute')
    console.log('')
    console.log('📋 Schema file location: supabase/schema.sql')
    console.log('📋 RLS policies location: supabase/rls-policies.sql')
    
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

applyMigration()
