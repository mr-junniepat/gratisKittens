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

// ============================================================================
// MIGRATE LATEST BLOG POSTS (2020-2025)
// ============================================================================

async function migrateLatestBlogPosts(connection: mysql.Connection) {
  console.log('🔄 Migrating latest blog posts (2020-2025)...')
  
  // Get WordPress blog posts from 2020 onwards
  const [wpPosts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'post' 
    AND post_status = 'publish'
    AND post_date >= '2020-01-01'
    ORDER BY post_date DESC
  `) as [any[], any]
  
  console.log(`📊 Found ${wpPosts.length} WordPress blog posts from 2020+`)
  
  // Get existing blog posts to avoid duplicates
  const { data: existingPosts } = await supabase
    .from('blog_posts')
    .select('wordpress_post_id')
  
  const existingWpIds = new Set(existingPosts?.map(p => p.wordpress_post_id) || [])
  
  // Get user mapping (use existing profiles)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('wordpress_user_id, id')
  
  const userMap = new Map<number, string>()
  profiles?.forEach(profile => {
    if (profile.wordpress_user_id) {
      userMap.set(profile.wordpress_user_id, profile.id)
    }
  })
  
  let migratedCount = 0
  let skippedCount = 0
  
  for (const wpPost of wpPosts) {
    try {
      // Skip if already migrated
      if (existingWpIds.has(wpPost.ID)) {
        skippedCount++
        continue
      }
      
      // Map author (use first available user if author not found)
      let authorId = userMap.get(wpPost.post_author)
      if (!authorId && profiles && profiles.length > 0) {
        authorId = profiles[0].id // Use first available user
        console.log(`⚠️ Using fallback author for post ${wpPost.ID}`)
      }
      
      if (!authorId) {
        console.log(`❌ Skipping post ${wpPost.ID}: no author available`)
        skippedCount++
        continue
      }
      
          // Create blog post
          const { error: postError } = await supabase
            .from('blog_posts')
            .insert({
              wordpress_post_id: wpPost.ID,
              title: wpPost.post_title,
              slug: wpPost.post_name,
              content: wpPost.post_content,
              excerpt: wpPost.post_excerpt,
              author_id: authorId,
              status: wpPost.post_status === 'publish' ? 'published' : wpPost.post_status,
              created_at: wpPost.post_date, // Use original WordPress date
            })
      
      if (!postError) {
        migratedCount++
        console.log(`✅ Created blog post: ${wpPost.post_title} (${wpPost.post_date})`)
      } else {
        console.error(`❌ Failed to create blog post ${wpPost.ID}:`, postError.message)
        skippedCount++
      }
    } catch (error) {
      console.error(`❌ Error creating blog post ${wpPost.ID}:`, error)
      skippedCount++
    }
  }
  
  console.log(`🎉 Blog post migration complete: ${migratedCount} migrated, ${skippedCount} skipped`)
  return migratedCount
}

// ============================================================================
// MIGRATE LATEST AD LISTINGS (2020-2025)
// ============================================================================

async function migrateLatestAdListings(connection: mysql.Connection) {
  console.log('🔄 Migrating latest ad listings (2020-2025)...')
  
  // Get WordPress ad listings from 2020 onwards
  const [wpPosts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'ad_listing' 
    AND post_status = 'publish'
    AND post_date >= '2020-01-01'
    ORDER BY post_date DESC
  `) as [any[], any]
  
  console.log(`📊 Found ${wpPosts.length} WordPress ad listings from 2020+`)
  
  // Get existing ad listings to avoid duplicates
  const { data: existingAds } = await supabase
    .from('ad_listings')
    .select('wordpress_post_id')
  
  const existingWpIds = new Set(existingAds?.map(a => a.wordpress_post_id) || [])
  
  // Get user mapping (use existing profiles)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('wordpress_user_id, id')
  
  const userMap = new Map<number, string>()
  profiles?.forEach(profile => {
    if (profile.wordpress_user_id) {
      userMap.set(profile.wordpress_user_id, profile.id)
    }
  })
  
  // Get all post meta for ad listings
  const [postmeta] = await connection.execute(`
    SELECT post_id, meta_key, meta_value 
    FROM wp_postmeta 
    WHERE post_id IN (${wpPosts.map(p => p.ID).join(',')})
  `) as [any[], any]
  
  let migratedCount = 0
  let skippedCount = 0
  
  for (const wpPost of wpPosts) {
    try {
      // Skip if already migrated
      if (existingWpIds.has(wpPost.ID)) {
        skippedCount++
        continue
      }
      
      // Map author (use first available user if author not found)
      let authorId = userMap.get(wpPost.post_author)
      if (!authorId && profiles && profiles.length > 0) {
        authorId = profiles[0].id // Use first available user
        console.log(`⚠️ Using fallback author for ad ${wpPost.ID}`)
      }
      
      if (!authorId) {
        console.log(`❌ Skipping ad ${wpPost.ID}: no author available`)
        skippedCount++
        continue
      }
      
      // Get all meta for this post
      const meta = postmeta.filter(m => m.post_id === wpPost.ID)
      const metaObj: Record<string, string> = {}
      meta.forEach(m => metaObj[m.meta_key] = m.meta_value)
      
          // Create ad listing
          const { error: adError } = await supabase
            .from('ad_listings')
            .insert({
              wordpress_post_id: wpPost.ID,
              title: wpPost.post_title,
              slug: wpPost.post_name,
              content: wpPost.post_content,
              excerpt: wpPost.post_excerpt,
              author_id: authorId,
              status: wpPost.post_status === 'publish' ? 'published' : wpPost.post_status,
              created_at: wpPost.post_date, // Use original WordPress date
          
          // Kitten details
          kitten_age: metaObj.cp_age || null,
          kitten_breed: metaObj.cp_breed || null,
          kitten_gender: metaObj.cp_gender || null,
          number_of_kittens: metaObj.cp_aantal_kittens ? parseInt(metaObj.cp_aantal_kittens) : null,
          date_of_birth: null, // Skip invalid date formats
          
          // Location
          city: metaObj.cp_locatie || null,
          
          // Contact
          contact_phone: metaObj.cp_telefoon || null,
          contact_email: metaObj.cp_email || null,
          
          // Health
          vaccinated: metaObj.cp_gevaccineerd === '1',
          chipped: metaObj.cp_gechipt === '1',
          
          // Pricing
          price: metaObj.cp_prijs || '0',
          is_free: metaObj.cp_prijs === '0' || !metaObj.cp_prijs,
        })
      
      if (!adError) {
        migratedCount++
        console.log(`✅ Created ad listing: ${wpPost.post_title} (${wpPost.post_date})`)
      } else {
        console.error(`❌ Failed to create ad listing ${wpPost.ID}:`, adError.message)
        skippedCount++
      }
    } catch (error) {
      console.error(`❌ Error creating ad listing ${wpPost.ID}:`, error)
      skippedCount++
    }
  }
  
  console.log(`🎉 Ad listing migration complete: ${migratedCount} migrated, ${skippedCount} skipped`)
  return migratedCount
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function migrateLatestContent() {
  console.log('🚀 Starting migration of latest content (2020-2025)...')
  
  // Connect to MySQL
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })
  
  try {
    // Migrate latest blog posts
    const blogCount = await migrateLatestBlogPosts(connection)
    
    // Migrate latest ad listings
    const adCount = await migrateLatestAdListings(connection)
    
    console.log('\n🎉 Migration Summary:')
    console.log(`📝 Blog posts migrated: ${blogCount}`)
    console.log(`📋 Ad listings migrated: ${adCount}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await connection.end()
  }
}

// Run the migration
migrateLatestContent()
