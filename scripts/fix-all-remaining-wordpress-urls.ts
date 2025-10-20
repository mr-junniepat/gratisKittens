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

async function fixAllRemainingWordPressUrls() {
  console.log('🔧 Fixing ALL remaining WordPress URLs in image_urls...')

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

    console.log(`Found ${ads?.length || 0} ads with image_urls`)

    let updatedAds = 0
    let skippedAds = 0

    for (const ad of ads || []) {
      try {
        if (!ad.image_urls || !Array.isArray(ad.image_urls)) {
          skippedAds++
          continue
        }

        // Check if any URLs are still WordPress URLs
        const hasWordPressUrls = ad.image_urls.some(url => 
          url && typeof url === 'string' && url.includes('gratiskittens.com')
        )

        if (!hasWordPressUrls) {
          skippedAds++
          continue
        }

        // Convert WordPress URLs to Supabase Storage URLs
        const updatedImageUrls = ad.image_urls.map(wpUrl => {
          if (!wpUrl || !wpUrl.includes('gratiskittens.com')) {
            return wpUrl // Keep non-WordPress URLs as-is
          }

          // Extract the filename from WordPress URL
          const urlParts = wpUrl.split('/')
          const fileName = urlParts[urlParts.length - 1]
          
          // Generate Supabase Storage URL using the same naming convention
          const timestamp = Date.now()
          const index = ad.image_urls.indexOf(wpUrl)
          const supabaseFileName = `${ad.id}-gallery-${index}-${timestamp}-${fileName}`
          return `http://127.0.0.1:54321/storage/v1/object/public/ad-images/${supabaseFileName}`
        })

        // Update the database
        const { error: updateError } = await supabase
          .from('ad_listings')
          .update({ image_urls: updatedImageUrls })
          .eq('id', ad.id)

        if (updateError) {
          console.error(`Failed to update ad ${ad.id}:`, updateError.message)
          skippedAds++
        } else {
          updatedAds++
          console.log(`✓ Updated ad: ${ad.title} (${updatedImageUrls.length} gallery images)`)
        }

      } catch (error) {
        console.error(`Error processing ad ${ad.id}:`, error)
        skippedAds++
      }
    }

    console.log(`\n✅ All remaining WordPress URLs fix completed!`)
    console.log(`📊 Results:`)
    console.log(`  - Updated ads: ${updatedAds}`)
    console.log(`  - Skipped ads: ${skippedAds}`)

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixAllRemainingWordPressUrls().catch(console.error)
