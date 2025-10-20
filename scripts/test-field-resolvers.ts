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

async function testFieldResolvers() {
  console.log('🔍 Testing GraphQL field resolvers...')

  // Get an ad with images
  const { data: ads, error } = await supabase
    .from('ad_listings')
    .select(`
      *,
      author:profiles(*)
    `)
    .not('featured_image_url', 'is', null)
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!ads || ads.length === 0) {
    console.log('❌ No ads with images found')
    return
  }

  const ad = ads[0]
  console.log('📄 Raw ad data:')
  console.log(`ID: ${ad.id}`)
  console.log(`Title: ${ad.title}`)
  console.log(`featured_image_url: ${ad.featured_image_url}`)
  console.log(`image_urls: ${JSON.stringify(ad.image_urls)}`)

  // Test the field resolvers manually
  console.log('\n🔍 Testing field resolvers:')
  console.log(`featuredImageUrl: ${ad.featured_image_url}`)
  console.log(`imageUrls: ${JSON.stringify(ad.image_urls || [])}`)

  // Test GraphQL query directly
  console.log('\n🔍 Testing GraphQL query...')
  const response = await fetch('http://127.0.0.1:3003/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          adListing(id: "${ad.id}") {
            id
            title
            featuredImageUrl
            imageUrls
          }
        }
      `,
    }),
  })

  const result = await response.json()
  console.log('GraphQL result:', JSON.stringify(result, null, 2))
}

testFieldResolvers()
