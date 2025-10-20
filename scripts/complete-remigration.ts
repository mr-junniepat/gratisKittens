import { createClient } from '@supabase/supabase-js'
import mysql from 'mysql2/promise'
import crypto from 'crypto'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================================================
// IMPROVED EMAIL VALIDATION (includes Belgian domains)
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  
  // Allow legitimate domains including Belgian ones
  const validDomains = [
    // International
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
    'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'tutanota.com',
    // Belgian domains
    'telenet.be', 'skynet.be', 'hotmail.be', 'live.be', 'outlook.be', 'live.nl',
    // Other legitimate domains
    '163.com', 'msn.com', 'yahoo.be', 'yahoo.nl', 'yahoo.fr', 'yahoo.co.uk',
    'orange.fr', 'free.fr', 'laposte.net', 'wanadoo.fr', 'sfr.fr'
  ]

  // Block only obvious spam patterns
  const suspiciousPatterns = [
    'emailsinfo', 'khabmails', 'serpmenow', 'masum.cc', 'donkihotes', 
    '4serial', 'zopesystems', 'serpmails', 'spamavert'
  ]

  if (suspiciousPatterns.some(pattern => domain.includes(pattern))) {
    return false
  }

  return validDomains.includes(domain)
}

// ============================================================================
// COMPLETE REMIGRATION
// ============================================================================

interface WordPressUser {
  ID: number
  user_login: string
  user_email: string
  user_nicename: string
  display_name: string
  user_registered: string
}

interface WordPressPost {
  ID: number
  post_author: number
  post_date: string
  post_content: string
  post_title: string
  post_excerpt: string
  post_status: string
  post_name: string
  post_type: string
}

interface PostMeta {
  post_id: number
  meta_key: string
  meta_value: string
}

interface Attachment {
  ID: number
  post_parent: number
  post_title: string
  post_mime_type: string
  file_path: string
}

function generateImageUrl(filePath: string): string {
  return `https://gratiskittens.com/wp-content/uploads/${filePath}`
}

async function completeRemigration() {
  console.log('🚀 Starting complete re-migration with improved email validation...')
  
  // Connect to WordPress data
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // 1. Clear existing data (optional - comment out if you want to keep existing)
    console.log('🗑️ Clearing existing data...')
    await supabase.from('ad_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('blog_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 2. Migrate ALL users with improved validation
    console.log('👥 Migrating users with improved email validation...')
    
    const [wpUsers] = await connection.execute(`
      SELECT ID, user_login, user_email, user_nicename, display_name, user_registered
      FROM wp_users
      WHERE user_email IS NOT NULL AND user_email != ''
    `) as [WordPressUser[], any]

    const userMap = new Map<number, string>()
    let migratedUsers = 0
    let skippedUsers = 0

    for (const wpUser of wpUsers) {
      try {
        if (!isValidEmail(wpUser.user_email)) {
          skippedUsers++
          continue
        }

        // Generate UUID for profile
        const userId = crypto.randomUUID()

        // Create profile directly
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: wpUser.user_login,
            display_name: wpUser.display_name,
            email: wpUser.user_email,
            wordpress_user_id: wpUser.ID,
            created_at: wpUser.user_registered,
            needs_password_reset: true,
            auth_user_created: false,
          })

        if (!profileError) {
          userMap.set(wpUser.ID, userId)
          migratedUsers++
          if (migratedUsers % 1000 === 0) {
            console.log(`✓ Migrated ${migratedUsers} users...`)
          }
        } else {
          console.error(`Failed to create profile for ${wpUser.user_email}:`, profileError.message)
        }
      } catch (error) {
        console.error(`Error migrating user ${wpUser.user_email}:`, error)
      }
    }

    console.log(`✅ User migration complete: ${migratedUsers} migrated, ${skippedUsers} skipped`)

    // 3. Get ALL ad listings
    console.log('📋 Migrating ALL ad listings...')
    
    const [wpPosts] = await connection.execute(`
      SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
             post_status, post_name, post_type
      FROM wp_posts 
      WHERE post_type = 'ad_listing' AND post_status = 'publish'
    `) as [WordPressPost[], any]

    // Get all post meta
    const [wpPostMeta] = await connection.execute(`
      SELECT post_id, meta_key, meta_value 
      FROM wp_postmeta 
      WHERE post_id IN (${wpPosts.map(p => p.ID).join(',')})
    `) as [PostMeta[], any]

    // Get all attachments for ad listings
    const [wpAttachments] = await connection.execute(`
      SELECT att.ID, att.post_parent, att.post_title, att.post_mime_type, pm.meta_value as file_path
      FROM wp_posts att
      JOIN wp_posts p ON att.post_parent = p.ID
      JOIN wp_postmeta pm ON att.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND att.post_type = 'attachment'
        AND att.post_mime_type LIKE 'image/%'
    `) as [Attachment[], any]

    // Get featured images
    const [wpFeaturedImages] = await connection.execute(`
      SELECT p.ID as post_id, pm.meta_value as thumbnail_id, attpm.meta_value as file_path
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
      JOIN wp_postmeta attpm ON pm.meta_value = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
    `) as [any[], any]

    console.log(`Found ${wpPosts.length} ad listings, ${wpAttachments.length} attachments, ${wpFeaturedImages.length} featured images`)

    let migratedAds = 0
    let skippedAds = 0

    for (const post of wpPosts) {
      try {
        // Get all meta for this post
        const meta = wpPostMeta.filter(m => m.post_id === post.ID)
        const metaObj: Record<string, string> = {}
        meta.forEach(m => metaObj[m.meta_key] = m.meta_value)

        // Map author
        const authorId = userMap.get(post.post_author)
        if (!authorId) {
          skippedAds++
          continue
        }

        // Get attachments for this post
        const postAttachments = wpAttachments.filter(att => att.post_parent === post.ID)
        const imageUrls = postAttachments.map(att => generateImageUrl(att.file_path))

        // Get featured image
        const featuredImage = wpFeaturedImages.find(fi => fi.post_id === post.ID)
        const featuredImageUrl = featuredImage ? generateImageUrl(featuredImage.file_path) : null

        const adData = {
          wordpress_post_id: post.ID,
          title: post.post_title,
          slug: post.post_name,
          content: post.post_content,
          excerpt: post.post_excerpt,

          // Kitten details
          kitten_age: metaObj.cp_age || null,
          kitten_breed: metaObj.cp_breed || null,
          kitten_gender: metaObj.cp_gender || null,
          number_of_kittens: metaObj.cp_aantal_kittens ? parseInt(metaObj.cp_aantal_kittens) : null,
          date_of_birth: metaObj.cp_datum_geboorte || null,

          // Location
          city: metaObj.cp_city || null,
          province: metaObj.cp_state || null,
          country: metaObj.cp_country || 'Nederland',
          postal_code: metaObj.cp_zipcode || null,

          // Contact
          contact_phone: metaObj.cp_phone || null,
          contact_email: metaObj.cp_email || null,

          // Health
          vaccinated: metaObj.cp_vaccinated === 'yes',
          chipped: metaObj.cp_chipped === 'yes',
          toilet_trained: metaObj.cp_zindelijk === 'yes',

          // Pricing
          price: metaObj.cp_price ? parseFloat(metaObj.cp_price) : 0,
          is_free: !metaObj.cp_price || metaObj.cp_price === '0',
          marked_as_sold: metaObj.cp_sold === 'yes',
          is_sought: metaObj.cp_sought === 'yes',

          // Analytics
          total_views: metaObj.cp_total_count ? parseInt(metaObj.cp_total_count) : 0,
          today_views: metaObj.cp_daily_count ? parseInt(metaObj.cp_daily_count) : 0,

          // Images
          featured_image_url: featuredImageUrl,
          image_urls: imageUrls.length > 0 ? imageUrls : null,

          // Metadata
          created_at: post.post_date,
          status: 'published',
          author_id: authorId,
        }

        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)

        if (!error) {
          migratedAds++
          if (migratedAds % 500 === 0) {
            console.log(`✓ Migrated ${migratedAds} ads...`)
          }
        } else {
          console.error(`Failed to migrate ad ${post.ID}:`, error.message)
        }
      } catch (error) {
        console.error(`Error migrating ad ${post.ID}:`, error)
      }
    }

    console.log(`✅ Ad migration complete: ${migratedAds} migrated, ${skippedAds} skipped`)

    // 4. Migrate blog posts with images
    console.log('📝 Migrating blog posts...')
    
    const [wpBlogPosts] = await connection.execute(`
      SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
             post_status, post_name, post_type
      FROM wp_posts 
      WHERE post_type = 'post' AND post_status = 'publish'
    `) as [WordPressPost[], any]

    // Get featured images for blog posts
    const [wpBlogFeaturedImages] = await connection.execute(`
      SELECT p.ID as post_id, pm.meta_value as thumbnail_id, attpm.meta_value as file_path
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
      JOIN wp_postmeta attpm ON pm.meta_value = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'post' 
        AND p.post_status = 'publish'
    `) as [any[], any]

    let migratedBlogs = 0

    for (const post of wpBlogPosts) {
      try {
        const authorId = userMap.get(post.post_author)
        if (!authorId) continue

        // Get featured image
        const featuredImage = wpBlogFeaturedImages.find(fi => fi.post_id === post.ID)
        const featuredImageUrl = featuredImage ? generateImageUrl(featuredImage.file_path) : null

        const { error } = await supabase
          .from('blog_posts')
          .insert({
            wordpress_post_id: post.ID,
            title: post.post_title,
            slug: post.post_name,
            content: post.post_content,
            excerpt: post.post_excerpt,
            featured_image_url: featuredImageUrl,
            status: 'published',
            created_at: post.post_date,
            published_at: post.post_date,
            author_id: authorId,
          })

        if (!error) {
          migratedBlogs++
        } else {
          console.error(`Failed to migrate blog post ${post.ID}:`, error.message)
        }
      } catch (error) {
        console.error(`Error migrating blog post ${post.ID}:`, error)
      }
    }

    console.log(`✅ Blog migration complete: ${migratedBlogs} migrated`)

    console.log('\n🎉 Complete re-migration finished!')
    console.log(`📊 Final counts:`)
    console.log(`  - Users: ${migratedUsers}`)
    console.log(`  - Ad listings: ${migratedAds}`)
    console.log(`  - Blog posts: ${migratedBlogs}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await connection.end()
  }
}

completeRemigration().catch(console.error)
