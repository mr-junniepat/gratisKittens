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
// EMAIL VALIDATION
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  
  // Only allow well-known legitimate domains
  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
    'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'tutanota.com'
  ]
  
  return validDomains.includes(domain)
}

// ============================================================================
// MIGRATE MISSING USERS
// ============================================================================

async function migrateMissingUsers(connection: mysql.Connection) {
  console.log('🔄 Migrating missing users...')
  
  // Get all WordPress users
  const [wpUsers] = await connection.execute(`
    SELECT ID, user_login, user_email, display_name, user_registered
    FROM wp_users 
    WHERE user_email IS NOT NULL AND user_email != ''
    ORDER BY ID
  `) as [any[], any]
  
  console.log(`📊 Found ${wpUsers.length} WordPress users`)
  
  // Get existing profiles to avoid duplicates
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('wordpress_user_id, username')
  
  const existingWpIds = new Set(existingProfiles?.map(p => p.wordpress_user_id) || [])
  const existingUsernames = new Set(existingProfiles?.map(p => p.username) || [])
  
  console.log(`📊 Found ${existingProfiles?.length || 0} existing profiles`)
  
  let migratedCount = 0
  let skippedCount = 0
  
  for (const wpUser of wpUsers) {
    try {
      // Skip if already migrated
      if (existingWpIds.has(wpUser.ID)) {
        skippedCount++
        continue
      }
      
      // Validate email
      if (!isValidEmail(wpUser.user_email)) {
        console.log(`❌ Skipping user ${wpUser.user_login}: invalid email ${wpUser.user_email}`)
        skippedCount++
        continue
      }
      
      // Generate unique username if duplicate
      let username = wpUser.user_login
      let counter = 1
      while (existingUsernames.has(username)) {
        username = `${wpUser.user_login}_${counter}`
        counter++
      }
      
      // Create profile
      const userId = crypto.randomUUID()
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          display_name: wpUser.display_name,
          email: wpUser.user_email,
          wordpress_user_id: wpUser.ID,
          created_at: wpUser.user_registered,
          needs_password_reset: true, // Flag for password reset
          auth_user_created: false, // Flag to track if auth user was created
        })
      
      if (!profileError) {
        existingUsernames.add(username)
        migratedCount++
        console.log(`✅ Created profile: ${wpUser.user_email} (${username})`)
      } else {
        console.error(`❌ Failed to create profile for ${wpUser.user_email}:`, profileError.message)
        skippedCount++
      }
    } catch (error) {
      console.error(`❌ Error creating profile for ${wpUser.user_email}:`, error)
      skippedCount++
    }
  }
  
  console.log(`🎉 User migration complete: ${migratedCount} migrated, ${skippedCount} skipped`)
  return migratedCount
}

// ============================================================================
// MIGRATE MISSING BLOG POSTS
// ============================================================================

async function migrateMissingBlogPosts(connection: mysql.Connection) {
  console.log('🔄 Migrating missing blog posts...')
  
  // Get all WordPress blog posts
  const [wpPosts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'post' AND post_status = 'publish'
    ORDER BY post_date DESC
  `) as [any[], any]
  
  console.log(`📊 Found ${wpPosts.length} WordPress blog posts`)
  
  // Get existing blog posts to avoid duplicates
  const { data: existingPosts } = await supabase
    .from('blog_posts')
    .select('wordpress_post_id')
  
  const existingWpIds = new Set(existingPosts?.map(p => p.wordpress_post_id) || [])
  
  console.log(`📊 Found ${existingPosts?.length || 0} existing blog posts`)
  
  // Get user mapping
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
      
      // Map author
      const authorId = userMap.get(wpPost.post_author)
      if (!authorId) {
        console.log(`❌ Skipping post ${wpPost.ID}: author not found`)
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
          status: wpPost.post_status,
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
// MIGRATE MISSING AD LISTINGS
// ============================================================================

async function migrateMissingAdListings(connection: mysql.Connection) {
  console.log('🔄 Migrating missing ad listings...')
  
  // Get all WordPress ad listings
  const [wpPosts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'ad_listing' AND post_status = 'publish'
    ORDER BY post_date DESC
  `) as [any[], any]
  
  console.log(`📊 Found ${wpPosts.length} WordPress ad listings`)
  
  // Get existing ad listings to avoid duplicates
  const { data: existingAds } = await supabase
    .from('ad_listings')
    .select('wordpress_post_id')
  
  const existingWpIds = new Set(existingAds?.map(a => a.wordpress_post_id) || [])
  
  console.log(`📊 Found ${existingAds?.length || 0} existing ad listings`)
  
  // Get user mapping
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
      
      // Map author
      const authorId = userMap.get(wpPost.post_author)
      if (!authorId) {
        console.log(`❌ Skipping ad ${wpPost.ID}: author not found`)
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
          status: wpPost.post_status,
          
          // Kitten details
          kitten_age: metaObj.cp_age || null,
          kitten_breed: metaObj.cp_breed || null,
          kitten_gender: metaObj.cp_gender || null,
          number_of_kittens: metaObj.cp_aantal_kittens ? parseInt(metaObj.cp_aantal_kittens) : null,
          date_of_birth: null, // Skip invalid date formats for now
          
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

async function migrateMissingContent() {
  console.log('🚀 Starting migration of missing content...')
  
  // Connect to MySQL
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })
  
  try {
    // Migrate missing users
    const userCount = await migrateMissingUsers(connection)
    
    // Migrate missing blog posts
    const blogCount = await migrateMissingBlogPosts(connection)
    
    // Migrate missing ad listings
    const adCount = await migrateMissingAdListings(connection)
    
    console.log('\n🎉 Migration Summary:')
    console.log(`👥 Users migrated: ${userCount}`)
    console.log(`📝 Blog posts migrated: ${blogCount}`)
    console.log(`📋 Ad listings migrated: ${adCount}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await connection.end()
  }
}

// Run the migration
migrateMissingContent()
