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

async function findRemainingWordPressUrls() {
  console.log('🔍 Finding remaining WordPress URLs in image_urls...')

  try {
    // Get all ad listings with image_urls
    const { data: ads, error } = await supabase
      .from('ad_listings')
      .select('id, title, image_urls')
      .not('image_urls', 'is', null)

    if (error) {
      console.error('Error fetching ad listings:', error)
      return
    }

    const remainingWordPressUrls: any[] = []

    for (const ad of ads || []) {
      if (ad.image_urls && Array.isArray(ad.image_urls)) {
        const hasWordPressUrl = ad.image_urls.some(url => 
          url && typeof url === 'string' && url.includes('gratiskittens.com')
        )
        
        if (hasWordPressUrl) {
          remainingWordPressUrls.push({
            id: ad.id,
            title: ad.title,
            image_urls: ad.image_urls
          })
        }
      }
    }

    console.log(`Found ${remainingWordPressUrls.length} ad listings with remaining WordPress URLs:`)
    
    for (const ad of remainingWordPressUrls) {
      console.log(`\n📋 ${ad.title} (${ad.id}):`)
      ad.image_urls.forEach((url, index) => {
        if (url && url.includes('gratiskittens.com')) {
          console.log(`  ${index}: ${url}`)
        }
      })
    }

    return remainingWordPressUrls

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

findRemainingWordPressUrls().catch(console.error)
