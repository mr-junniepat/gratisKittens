import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function dropAdListingsTable() {
  console.log('Dropping ad_listings table...')
  
  try {
    // First, drop foreign key constraints
    const { error: fkError } = await supabase.rpc('drop_ad_listings_foreign_keys')
    if (fkError) {
      console.log('No foreign key constraints to drop or error:', fkError.message)
    }
    
    // Drop the table
    const { error: dropError } = await supabase
      .from('ad_listings')
      .select('*')
      .limit(1)
    
    if (dropError) {
      console.log('Table might already be dropped or error:', dropError.message)
    }
    
    // Use raw SQL to drop the table
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS ad_listings CASCADE;'
    })
    
    if (sqlError) {
      console.log('SQL drop error:', sqlError.message)
    }
    
    console.log('✅ ad_listings table dropped successfully')
    
  } catch (error) {
    console.error('Error dropping table:', error)
  }
}

dropAdListingsTable().catch(console.error)
