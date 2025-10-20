import { createClient } from '@supabase/supabase-js'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAdStatus() {
  console.log('🔍 Checking ad listing status values...')

  // Get unique status values
  const { data: statuses, error } = await supabase
    .from('ad_listings')
    .select('status')
    .not('status', 'is', null)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  const uniqueStatuses = [...new Set(statuses?.map(s => s.status))]
  console.log('📊 Unique status values:', uniqueStatuses)

  // Check ads with images by status
  for (const status of uniqueStatuses) {
    const { count } = await supabase
      .from('ad_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
      .not('featured_image_url', 'is', null)

    console.log(`📊 ${status}: ${count} ads with images`)
  }
}

checkAdStatus()
