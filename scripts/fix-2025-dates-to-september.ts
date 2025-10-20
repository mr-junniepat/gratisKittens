import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function fix2025Dates() {
  console.log('Fixing 2025 dates to match WordPress...')
  
  // Get all 2025 posts
  const { data: posts, error } = await supabase
    .from('ad_listings')
    .select('id, title, created_at')
    .gte('created_at', '2025-01-01')
    .lte('created_at', '2025-12-31')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching posts:', error)
    return
  }
  
  console.log(`Found ${posts?.length} posts with 2025 dates`)
  
  // Create September 2025 dates that match the WordPress image
  const septemberDates = [
    '2025-09-29T10:00:00+00:00', // 29 september 2025
    '2025-09-28T10:00:00+00:00', // 28 september 2025
    '2025-09-26T10:00:00+00:00', // 26 september 2025
    '2025-09-24T10:00:00+00:00', // 24 september 2025
    '2025-09-21T10:00:00+00:00', // 21 september 2025
    '2025-09-17T10:00:00+00:00', // 17 september 2025
    '2025-09-14T10:00:00+00:00', // 14 september 2025
    '2025-09-12T10:00:00+00:00', // 12 september 2025
    '2025-09-09T10:00:00+00:00', // 9 september 2025
    '2025-09-08T10:00:00+00:00', // 8 september 2025
  ]
  
  // Update posts with September dates
  for (let i = 0; i < Math.min(posts?.length || 0, septemberDates.length); i++) {
    const post = posts![i]
    const newDate = septemberDates[i]
    
    console.log(`Updating "${post.title}" to ${newDate}`)
    
    const { error: updateError } = await supabase
      .from('ad_listings')
      .update({ 
        created_at: newDate
      })
      .eq('id', post.id)
    
    if (updateError) {
      console.error(`Error updating post ${post.id}:`, updateError)
    } else {
      console.log(`✓ Updated "${post.title}"`)
    }
  }
  
  console.log('Date updates completed!')
}

fix2025Dates().catch(console.error)
