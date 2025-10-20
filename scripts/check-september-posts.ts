import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUpdatedPosts() {
  console.log('Checking updated posts...')
  
  const { data: posts, error } = await supabase
    .from('ad_listings')
    .select('id, title, created_at')
    .gte('created_at', '2025-09-01')
    .lte('created_at', '2025-09-30')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${posts?.length} September 2025 posts:`)
  posts?.forEach(post => {
    console.log(`- ${post.title} (${post.created_at})`)
  })
}

checkUpdatedPosts().catch(console.error)
