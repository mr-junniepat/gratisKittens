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

async function testGraphQLQuery() {
  console.log('🔍 Testing GraphQL query for ads with images...')

  // Test the same query that GraphQL API uses
  const { data, error } = await supabase
    .from('ad_listings')
    .select(`
      *,
      author:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 Found ${data?.length || 0} ads:`)
  
  for (const ad of data || []) {
    console.log(`\n📄 Ad: ${ad.title}`)
    console.log(`ID: ${ad.id}`)
    console.log(`Featured Image (raw): ${ad.featured_image_url}`)
    console.log(`Image URLs (raw): ${JSON.stringify(ad.image_urls)}`)
    console.log(`Author: ${ad.author?.username}`)
  }
}

testGraphQLQuery()
