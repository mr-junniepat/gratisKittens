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
// STEP 1: Load WordPress data into temporary MySQL database
// ============================================================================

async function loadWordPressData() {
  console.log('Connecting to MySQL container with WordPress data...')
  
  // Connect to the MySQL container where we imported the data
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  console.log('Connected to WordPress data successfully!')
  return connection
}

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
  
  // Block suspicious patterns
  const suspiciousPatterns = [
    'emailsinfo', 'bloger', 'masum', 'perfsoundmiss', 'temp', 'fake', 'spam',
    'disposable', 'throwaway', '10minutemail', 'guerrillamail'
  ]
  
  if (suspiciousPatterns.some(pattern => domain.includes(pattern))) {
    return false
  }
  
  return validDomains.includes(domain)
}

// ============================================================================
// STEP 2: Migrate users
// ============================================================================

interface WordPressUser {
  ID: number
  user_login: string
  user_email: string
  user_nicename: string
  display_name: string
  user_registered: string
}

async function migrateUsers(connection: mysql.Connection): Promise<Map<number, string>> {
  console.log('Migrating users to profiles table...')
  
  const [rows] = await connection.execute(`
    SELECT ID, user_login, user_email, user_nicename, display_name, user_registered 
    FROM wp_users 
    WHERE user_email IS NOT NULL AND user_email != ''
  `) as [WordPressUser[], any]
  
  const userMap = new Map<number, string>()
  
  for (const wpUser of rows) {
    try {
      // Generate a UUID for the user profile
      const userId = crypto.randomUUID()
      
      // Create profile directly in profiles table (no Supabase Auth yet)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: wpUser.user_login,
          display_name: wpUser.display_name,
          email: wpUser.user_email,
          wordpress_user_id: wpUser.ID,
          created_at: wpUser.user_registered,
          needs_password_reset: true, // Flag for password reset
          auth_user_created: false, // Flag to track if auth user was created
        })
      
      if (!profileError) {
        userMap.set(wpUser.ID, userId)
        console.log(`✓ Created profile: ${wpUser.user_email}`)
      } else {
        console.error(`Failed to create profile for ${wpUser.user_email}:`, profileError.message)
      }
    } catch (error) {
      console.error(`Error creating profile for ${wpUser.user_email}:`, error)
    }
  }
  
  console.log(`Successfully created ${userMap.size} user profiles`)
  console.log('📝 Note: Auth users will be created later via Supabase Auth')
  return userMap
}

// ============================================================================
// STEP 3: Migrate ad listings
// ============================================================================

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

async function migrateAdListings(
  connection: mysql.Connection,
  userMap: Map<number, string>
) {
  console.log('Migrating ad listings...')
  
  // Get all ad listings
  const [posts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'ad_listing' AND post_status = 'publish'
  `) as [WordPressPost[], any]
  
  // Get all post meta
  const [postmeta] = await connection.execute(`
    SELECT post_id, meta_key, meta_value 
    FROM wp_postmeta 
    WHERE post_id IN (${posts.map(p => p.ID).join(',')})
  `) as [PostMeta[], any]
  
  console.log(`Found ${posts.length} ad listings and ${postmeta.length} meta entries`)
  
  let migratedCount = 0
  
  for (const post of posts) {
    try {
      // Get all meta for this post
      const meta = postmeta.filter(m => m.post_id === post.ID)
      const metaObj: Record<string, string> = {}
      meta.forEach(m => metaObj[m.meta_key] = m.meta_value)
      
      // Map author
      const authorId = userMap.get(post.post_author)
      if (!authorId) {
        console.log(`Skipping ad ${post.ID}: author not found`)
        continue
      }
      
      // Extract only essential fields
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
        
        // Metadata
        created_at: post.post_date,
        status: 'published',
        author_id: authorId,
      }
      
      const { error } = await supabase
        .from('ad_listings')
        .insert(adData)
      
      if (error) {
        console.error(`Failed to migrate ad ${post.ID}:`, error.message)
      } else {
        migratedCount++
        if (migratedCount % 100 === 0) {
          console.log(`✓ Migrated ${migratedCount}/${posts.length} ads...`)
        }
      }
    } catch (error) {
      console.error(`Error migrating ad ${post.ID}:`, error)
    }
  }
  
  console.log(`Successfully migrated ${migratedCount} ad listings`)
}

// ============================================================================
// STEP 4: Migrate blog posts
// ============================================================================

async function migrateBlogPosts(
  connection: mysql.Connection,
  userMap: Map<number, string>
) {
  console.log('Migrating blog posts...')
  
  const [posts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'post' AND post_status = 'publish'
  `) as [WordPressPost[], any]
  
  console.log(`Found ${posts.length} blog posts`)
  
  let migratedCount = 0
  
  for (const post of posts) {
    try {
      const authorId = userMap.get(post.post_author)
      if (!authorId) {
        console.log(`Skipping blog post ${post.ID}: author not found`)
        continue
      }
      
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          wordpress_post_id: post.ID,
          title: post.post_title,
          slug: post.post_name,
          content: post.post_content,
          excerpt: post.post_excerpt,
          status: 'published',
          created_at: post.post_date,
          published_at: post.post_date,
          author_id: authorId,
        })
      
      if (!error) {
        migratedCount++
        console.log(`✓ Migrated blog post: ${post.post_title}`)
      } else {
        console.error(`Failed to migrate blog post ${post.ID}:`, error.message)
      }
    } catch (error) {
      console.error(`Error migrating blog post ${post.ID}:`, error)
    }
  }
  
  console.log(`Successfully migrated ${migratedCount} blog posts`)
}

// ============================================================================
// MAIN: Run migration
// ============================================================================

async function runMigration() {
  console.log('🚀 Starting WordPress to Supabase migration...')
  
  try {
    // Step 1: Load WordPress data
    const connection = await loadWordPressData()
    
    // Step 2: Migrate users
    const userMap = await migrateUsers(connection)
    
    // Step 3: Migrate ad listings
    await migrateAdListings(connection, userMap)
    
    // Step 4: Migrate blog posts
    await migrateBlogPosts(connection, userMap)
    
    // Close connection
    await connection.end()
    
    console.log('🎉 Migration completed successfully!')
    console.log('📊 Check your Supabase Studio at: http://127.0.0.1:54323')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
