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

async function checkAdImages() {
  console.log('🔍 Checking ad listing images in database...')

  // Get ad listings with images
  const { data: ads, error } = await supabase
    .from('ad_listings')
    .select('id, title, featured_image_url, image_urls')
    .not('featured_image_url', 'is', null)
    .limit(5)

  if (error) {
    console.error('❌ Error fetching ads:', error)
    return
  }

  console.log(`📊 Found ${ads?.length || 0} ads with featured images:`)
  
  for (const ad of ads || []) {
    console.log(`\n📄 Ad: ${ad.title}`)
    console.log(`ID: ${ad.id}`)
    console.log(`Featured Image: ${ad.featured_image_url}`)
    console.log(`Image URLs: ${JSON.stringify(ad.image_urls)}`)
  }

  // Also check total count
  const { count } = await supabase
    .from('ad_listings')
    .select('*', { count: 'exact', head: true })
    .not('featured_image_url', 'is', null)

  console.log(`\n📊 Total ads with featured images: ${count}`)

  // Check total ads
  const { count: totalAds } = await supabase
    .from('ad_listings')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total ads: ${totalAds}`)
}

checkAdImages()
