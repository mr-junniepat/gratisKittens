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
// COMPREHENSIVE MIGRATION - MIGRATE EVERYTHING
// ============================================================================

async function comprehensiveMigration() {
  console.log('🚀 Starting comprehensive migration - migrating ALL data...')
  
  // Connect to WordPress data
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // 1. Clear existing data
    console.log('🗑️ Clearing existing data...')
    await supabase.from('ad_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('blog_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 2. Migrate ALL users (no email filtering)
    console.log('👥 Migrating ALL users...')
    
    const [wpUsers] = await connection.execute(`
      SELECT ID, user_login, user_email, user_nicename, display_name, user_registered
      FROM wp_users
      WHERE user_email IS NOT NULL AND user_email != ''
      ORDER BY ID
    `) as [any[], any]

    const userMap = new Map<number, string>()
    let migratedUsers = 0
    let skippedUsers = 0

    for (const wpUser of wpUsers) {
      try {
        // Generate unique username if duplicate
        let username = wpUser.user_login
        let counter = 1
        while (true) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single()
          
          if (!existing) break
          username = `${wpUser.user_login}_${counter}`
          counter++
        }

        // Generate UUID for profile
        const userId = crypto.randomUUID()

        // Create profile directly (no email validation)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username,
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
          skippedUsers++
        }
      } catch (error) {
        console.error(`Error migrating user ${wpUser.user_email}:`, error)
        skippedUsers++
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
      ORDER BY ID
    `) as [any[], any]

    // Get all post meta
    const [wpPostMeta] = await connection.execute(`
      SELECT post_id, meta_key, meta_value 
      FROM wp_postmeta 
      WHERE post_id IN (${wpPosts.map(p => p.ID).join(',')})
    `) as [any[], any]

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
    `) as [any[], any]

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

        // Map author (use first available user if author not found)
        let authorId = userMap.get(post.post_author)
        if (!authorId) {
          // Find any user to use as fallback
          const fallbackUser = Array.from(userMap.values())[0]
          if (fallbackUser) {
            authorId = fallbackUser
          } else {
            skippedAds++
            continue
          }
        }

        // Get attachments for this post
        const postAttachments = wpAttachments.filter(att => att.post_parent === post.ID)
        const imageUrls = postAttachments.map(att => `https://gratiskittens.com/wp-content/uploads/${att.file_path}`)

        // Get featured image
        const featuredImage = wpFeaturedImages.find(fi => fi.post_id === post.ID)
        const featuredImageUrl = featuredImage ? `https://gratiskittens.com/wp-content/uploads/${featuredImage.file_path}` : null

        // Parse date safely
        let dateOfBirth = null
        try {
          const dateStr = metaObj.cp_datum_geboorte || ''
          if (dateStr && dateStr.trim() !== '' && dateStr !== '/' && dateStr !== '-' && dateStr !== '?' && 
              !dateStr.includes('maakt niet') && !dateStr.includes('onbekend') && !dateStr.includes('nvt')) {
            // Try to parse as date
            const parsed = new Date(dateStr)
            if (!isNaN(parsed.getTime())) {
              dateOfBirth = parsed.toISOString().split('T')[0]
            }
          }
        } catch (error) {
          // Ignore date parsing errors
        }

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
          date_of_birth: dateOfBirth,

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
          skippedAds++
        }
      } catch (error) {
        console.error(`Error migrating ad ${post.ID}:`, error)
        skippedAds++
      }
    }

    console.log(`✅ Ad migration complete: ${migratedAds} migrated, ${skippedAds} skipped`)

    // 4. Migrate ALL blog posts
    console.log('📝 Migrating ALL blog posts...')
    
    const [wpBlogPosts] = await connection.execute(`
      SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
             post_status, post_name, post_type
      FROM wp_posts 
      WHERE post_type = 'post' AND post_status = 'publish'
      ORDER BY ID
    `) as [any[], any]

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
    let skippedBlogs = 0

    for (const post of wpBlogPosts) {
      try {
        // Map author (use first available user if author not found)
        let authorId = userMap.get(post.post_author)
        if (!authorId) {
          // Find any user to use as fallback
          const fallbackUser = Array.from(userMap.values())[0]
          if (fallbackUser) {
            authorId = fallbackUser
          } else {
            skippedBlogs++
            continue
          }
        }

        // Get featured image
        const featuredImage = wpBlogFeaturedImages.find(fi => fi.post_id === post.ID)
        const featuredImageUrl = featuredImage ? `https://gratiskittens.com/wp-content/uploads/${featuredImage.file_path}` : null

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
          skippedBlogs++
        }
      } catch (error) {
        console.error(`Error migrating blog post ${post.ID}:`, error)
        skippedBlogs++
      }
    }

    console.log(`✅ Blog migration complete: ${migratedBlogs} migrated, ${skippedBlogs} skipped`)

    console.log('\n🎉 Comprehensive migration completed!')
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

comprehensiveMigration().catch(console.error)
