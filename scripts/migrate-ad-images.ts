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

async function migrateAdImages() {
  console.log('🔄 Migrating ad listing images from WordPress to Supabase...')

  // Connect to MySQL
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // Get all ad listings with their images from WordPress
    const [ads] = await connection.execute(`
      SELECT 
        p.ID, 
        p.post_title, 
        p.post_content, 
        p.post_date,
        GROUP_CONCAT(a.guid SEPARATOR '|||') as image_urls
      FROM wp_posts p
      LEFT JOIN wp_posts a ON a.post_parent = p.ID 
        AND a.post_type = 'attachment' 
        AND a.post_mime_type LIKE 'image%'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND a.guid IS NOT NULL
      GROUP BY p.ID
      LIMIT 50
    `)

    console.log(`📝 Found ${ads.length} ad listings with images`)

    for (const ad of ads) {
      console.log(`\n🔄 Processing ad: ${ad.post_title}`)
      
      if (!ad.image_urls) {
        console.log(`❌ No images found`)
        continue
      }

      const imageUrls = ad.image_urls.split('|||').filter(url => url.trim())
      console.log(`📸 Found ${imageUrls.length} images:`, imageUrls)

      const migratedImageUrls: string[] = []
      
      for (const imageUrl of imageUrls) {
        try {
          // Download image
          console.log(`⬇️ Downloading: ${imageUrl}`)
          const response = await fetch(imageUrl)
          
          if (!response.ok) {
            console.log(`❌ Failed to download ${imageUrl}: ${response.status}`)
            continue
          }

          const imageBuffer = await response.arrayBuffer()
          const fileName = imageUrl.split('/').pop() || 'image.jpg'
          const fileExtension = fileName.split('.').pop() || 'jpg'
          const uniqueFileName = `${crypto.randomUUID()}-${fileName}`

          // Fix MIME type for Supabase Storage
          let mimeType = `image/${fileExtension}`
          if (fileExtension === 'jpg') {
            mimeType = 'image/jpeg'
          }

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ad-images')
            .upload(uniqueFileName, imageBuffer, {
              contentType: mimeType,
              upsert: false
            })

          if (uploadError) {
            console.log(`❌ Upload error:`, uploadError)
            continue
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('ad-images')
            .getPublicUrl(uniqueFileName)

          const supabaseUrl = urlData.publicUrl
          migratedImageUrls.push(supabaseUrl)
          console.log(`✅ Uploaded: ${supabaseUrl}`)

        } catch (error) {
          console.log(`❌ Error processing ${imageUrl}:`, error)
        }
      }

      if (migratedImageUrls.length > 0) {
        // Find the corresponding ad in Supabase
        const { data: supabaseAds } = await supabase
          .from('ad_listings')
          .select('id, title')
          .eq('title', ad.post_title)
          .limit(1)

        if (supabaseAds && supabaseAds.length > 0) {
          const supabaseAd = supabaseAds[0]
          
          // Update the ad with image URLs
          const { error: updateError } = await supabase
            .from('ad_listings')
            .update({
              featured_image_url: migratedImageUrls[0], // Use first image as featured
              image_urls: migratedImageUrls
            })
            .eq('id', supabaseAd.id)

          if (updateError) {
            console.log(`❌ Update error:`, updateError)
          } else {
            console.log(`✅ Updated ad ${supabaseAd.id} with ${migratedImageUrls.length} images`)
          }
        } else {
          console.log(`❌ Could not find corresponding ad in Supabase`)
        }
      }
    }

  } finally {
    await connection.end()
  }

  console.log('\n🎉 Ad image migration completed!')
}

migrateAdImages().catch(console.error)
