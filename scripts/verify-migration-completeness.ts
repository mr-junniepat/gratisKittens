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

async function verifyMigrationCompleteness() {
  console.log('🔍 Verifying migration completeness...')
  
  // Connect to WordPress MySQL data
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // 1. Check total counts in WordPress vs Supabase
    console.log('\n📊 COMPARING COUNTS:')
    
    // WordPress counts
    const [wpUsers] = await connection.execute('SELECT COUNT(*) as count FROM wp_users') as [any[], any]
    const [wpAdListings] = await connection.execute("SELECT COUNT(*) as count FROM wp_posts WHERE post_type = 'ad_listing' AND post_status = 'publish'") as [any[], any]
    const [wpBlogPosts] = await connection.execute("SELECT COUNT(*) as count FROM wp_posts WHERE post_type = 'post' AND post_status = 'publish'") as [any[], any]
    
    // Supabase counts
    const { count: supabaseProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: supabaseAds } = await supabase.from('ad_listings').select('*', { count: 'exact', head: true })
    const { count: supabaseBlogs } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true })

    console.log('Users/Profiles:')
    console.log(`  WordPress: ${wpUsers[0].count}`)
    console.log(`  Supabase: ${supabaseProfiles}`)
    console.log(`  Difference: ${wpUsers[0].count - supabaseProfiles}`)

    console.log('\nAd Listings:')
    console.log(`  WordPress: ${wpAdListings[0].count}`)
    console.log(`  Supabase: ${supabaseAds}`)
    console.log(`  Difference: ${wpAdListings[0].count - supabaseAds}`)

    console.log('\nBlog Posts:')
    console.log(`  WordPress: ${wpBlogPosts[0].count}`)
    console.log(`  Supabase: ${supabaseBlogs}`)
    console.log(`  Difference: ${wpBlogPosts[0].count - supabaseBlogs}`)

    // 2. Check image attachments in WordPress
    console.log('\n📸 IMAGE ATTACHMENTS ANALYSIS:')
    
    const [wpAttachments] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM wp_posts 
      WHERE post_type = 'attachment' 
        AND post_mime_type LIKE 'image/%'
    `) as [any[], any]

    const [wpAttachmentsForAds] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM wp_posts att
      JOIN wp_posts ads ON att.post_parent = ads.ID
      WHERE att.post_type = 'attachment' 
        AND att.post_mime_type LIKE 'image/%'
        AND ads.post_type = 'ad_listing'
        AND ads.post_status = 'publish'
    `) as [any[], any]

    const [wpAttachmentsForBlogs] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM wp_posts att
      JOIN wp_posts blogs ON att.post_parent = blogs.ID
      WHERE att.post_type = 'attachment' 
        AND att.post_mime_type LIKE 'image/%'
        AND blogs.post_type = 'post'
        AND blogs.post_status = 'publish'
    `) as [any[], any]

    console.log(`Total WordPress image attachments: ${wpAttachments[0].count}`)
    console.log(`Image attachments for ad listings: ${wpAttachmentsForAds[0].count}`)
    console.log(`Image attachments for blog posts: ${wpAttachmentsForBlogs[0].count}`)

    // 3. Check what we actually migrated
    const { data: supabaseAdsWithImages } = await supabase
      .from('ad_listings')
      .select('id, featured_image_url, image_urls')
      .not('featured_image_url', 'is', null)

    const { data: supabaseBlogsWithImages } = await supabase
      .from('blog_posts')
      .select('id, featured_image_url')
      .not('featured_image_url', 'is', null)

    console.log('\n📊 MIGRATED IMAGES:')
    console.log(`Ad listings with featured images: ${supabaseAdsWithImages?.length || 0}`)
    console.log(`Blog posts with featured images: ${supabaseBlogsWithImages?.length || 0}`)

    // 4. Check for missing image attachments
    console.log('\n🔍 MISSING IMAGE ANALYSIS:')
    
    // Get ads that should have images but don't
    const [wpAdsWithImages] = await connection.execute(`
      SELECT ads.ID, ads.post_title, COUNT(att.ID) as image_count
      FROM wp_posts ads
      LEFT JOIN wp_posts att ON att.post_parent = ads.ID AND att.post_type = 'attachment' AND att.post_mime_type LIKE 'image/%'
      WHERE ads.post_type = 'ad_listing' 
        AND ads.post_status = 'publish'
      GROUP BY ads.ID, ads.post_title
      HAVING COUNT(att.ID) > 0
      ORDER BY image_count DESC
      LIMIT 10
    `) as [any[], any]

    console.log('\nTop 10 WordPress ads with most images:')
    for (const ad of wpAdsWithImages) {
      console.log(`  ${ad.ID}: "${ad.post_title}" - ${ad.image_count} images`)
    }

    // 5. Check for ads missing in Supabase
    console.log('\n🚨 POTENTIAL MISSING DATA:')
    
    const [wpAdsMissing] = await connection.execute(`
      SELECT wp.ID, wp.post_title, wp.post_author, wp.post_date
      FROM wp_posts wp
      WHERE wp.post_type = 'ad_listing' 
        AND wp.post_status = 'publish'
        AND wp.ID NOT IN (
          SELECT wordpress_post_id 
          FROM ad_listings 
          WHERE wordpress_post_id IS NOT NULL
        )
      LIMIT 10
    `) as [any[], any]

    if (wpAdsMissing.length > 0) {
      console.log('\nWordPress ads not found in Supabase:')
      for (const ad of wpAdsMissing) {
        console.log(`  ${ad.ID}: "${ad.post_title}" (author: ${ad.post_author}, date: ${ad.post_date})`)
      }
    } else {
      console.log('✅ All WordPress ads found in Supabase')
    }

    // 6. Check for users missing in Supabase
    const [wpUsersMissing] = await connection.execute(`
      SELECT wp.ID, wp.user_login, wp.user_email
      FROM wp_users wp
      WHERE wp.ID NOT IN (
        SELECT wordpress_user_id 
        FROM profiles 
        WHERE wordpress_user_id IS NOT NULL
      )
      LIMIT 10
    `) as [any[], any]

    if (wpUsersMissing.length > 0) {
      console.log('\nWordPress users not found in Supabase:')
      for (const user of wpUsersMissing) {
        console.log(`  ${user.ID}: ${user.user_login} (${user.user_email})`)
      }
    } else {
      console.log('✅ All WordPress users found in Supabase')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

verifyMigrationCompleteness().catch(console.error)
