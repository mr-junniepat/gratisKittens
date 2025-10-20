import { createClient } from '@supabase/supabase-js'
import mysql from 'mysql2/promise'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixGalleryImageUrls() {
  console.log('🔧 Fixing gallery image URLs in ad_listings...')
  
  // Connect to WordPress data
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // Get all ad listings with gallery images
    const { data: adsWithGallery, error } = await supabase
      .from('ad_listings')
      .select('id, wordpress_post_id, title, image_urls')
      .not('image_urls', 'is', null)

    if (error) {
      console.error('Error fetching ad listings:', error)
      return
    }

    console.log(`Found ${adsWithGallery?.length || 0} ads with gallery images`)

    // Get all attachments for ad listings from WordPress
    const [wpAttachments] = await connection.execute(`
      SELECT att.ID, att.post_parent, att.post_title, att.post_mime_type, pm.meta_value as file_path
      FROM wp_posts att
      JOIN wp_posts p ON att.post_parent = p.ID
      JOIN wp_postmeta pm ON att.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND att.post_type = 'attachment'
        AND att.post_mime_type LIKE 'image/%'
    `) as [any[], any]

    console.log(`Found ${wpAttachments.length} WordPress attachments`)

    let updatedAds = 0
    let skippedAds = 0

    for (const ad of adsWithGallery || []) {
      try {
        if (!ad.image_urls || !Array.isArray(ad.image_urls)) {
          skippedAds++
          continue
        }

        // Get attachments for this specific ad
        const adAttachments = wpAttachments.filter(att => att.post_parent === ad.wordpress_post_id)
        
        if (adAttachments.length === 0) {
          console.log(`No attachments found for ad ${ad.id} (WP ID: ${ad.wordpress_post_id})`)
          skippedAds++
          continue
        }

        // Create mapping from WordPress URLs to Supabase Storage URLs
        const urlMapping = new Map<string, string>()
        
        for (const attachment of adAttachments) {
          const wpUrl = `https://gratiskittens.com/wp-content/uploads/${attachment.file_path}`
          
          // Generate the Supabase Storage URL based on the naming convention used in migration
          const fileName = `${ad.id}-gallery-${Date.now()}-${attachment.file_path.split('/').pop()}`
          const supabaseUrl = `http://127.0.0.1:54321/storage/v1/object/public/ad-images/${fileName}`
          
          urlMapping.set(wpUrl, supabaseUrl)
        }

        // Update the image_urls array with Supabase Storage URLs
        const updatedImageUrls = ad.image_urls.map(wpUrl => {
          return urlMapping.get(wpUrl) || wpUrl // Keep original if no mapping found
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

    console.log(`\n✅ Gallery image URL fix completed!`)
    console.log(`📊 Results:`)
    console.log(`  - Updated ads: ${updatedAds}`)
    console.log(`  - Skipped ads: ${skippedAds}`)

  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await connection.end()
  }
}

fixGalleryImageUrls().catch(console.error)
