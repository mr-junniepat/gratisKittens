import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSupabase2025Ads() {
  console.log('🔍 Checking Supabase for 2025 ad listings...')
  
  const { data: ads, error } = await supabase
    .from('ad_listings')
    .select('id, title, created_at, wordpress_post_id')
    .gte('created_at', '2025-01-01')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`📊 Supabase ad listings from 2025: ${ads?.length || 0}`)
  
  if (ads && ads.length > 0) {
    console.log('\n📋 2025 ad listings in Supabase:')
    for (const ad of ads) {
      console.log(`- ${ad.title} (${ad.created_at}) - WP ID: ${ad.wordpress_post_id}`)
    }
  }
}

checkSupabase2025Ads()
