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
// STEP 2: Get existing user map from Supabase
// ============================================================================

async function getUserMap(): Promise<Map<number, string>> {
  console.log('Getting existing user map from Supabase...')
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('wordpress_user_id, id')
    .not('wordpress_user_id', 'is', null)

  if (error) {
    console.error('Error fetching profiles:', error)
    return new Map()
  }

  const userMap = new Map<number, string>()
  for (const profile of profiles || []) {
    if (profile.wordpress_user_id) {
      userMap.set(profile.wordpress_user_id, profile.id)
    }
  }

  console.log(`Found ${userMap.size} existing user mappings`)
  return userMap
}

// ============================================================================
// STEP 3: Migrate ad listings with images
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

interface Attachment {
  ID: number
  post_parent: number
  post_title: string
  post_mime_type: string
  file_path: string
}

function generateImageUrl(filePath: string): string {
  // Convert WordPress file path to full URL
  // Example: 2017/12/image.jpg -> https://gratiskittens.com/wp-content/uploads/2017/12/image.jpg
  return `https://gratiskittens.com/wp-content/uploads/${filePath}`
}

async function migrateAdListingsWithImages(
  connection: mysql.Connection,
  userMap: Map<number, string>
) {
  console.log('Migrating ad listings with images...')
  
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
  
  // Get all attachments for ad listings
  const [attachments] = await connection.execute(`
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
  const [featuredImages] = await connection.execute(`
    SELECT p.ID as post_id, pm.meta_value as thumbnail_id, attpm.meta_value as file_path
    FROM wp_posts p
    JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
    JOIN wp_postmeta attpm ON pm.meta_value = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
    WHERE p.post_type = 'ad_listing' 
      AND p.post_status = 'publish'
  `) as [any[], any]
  
  console.log(`Found ${posts.length} ad listings, ${attachments.length} attachments, ${featuredImages.length} featured images`)
  
  let migratedCount = 0
  let updatedCount = 0
  
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
      
      // Get attachments for this post
      const postAttachments = attachments.filter(att => att.post_parent === post.ID)
      const imageUrls = postAttachments.map(att => generateImageUrl(att.file_path))
      
      // Get featured image
      const featuredImage = featuredImages.find(fi => fi.post_id === post.ID)
      const featuredImageUrl = featuredImage ? generateImageUrl(featuredImage.file_path) : null
      
      // Check if this ad already exists in Supabase
      const { data: existingAd } = await supabase
        .from('ad_listings')
        .select('id')
        .eq('wordpress_post_id', post.ID)
        .single()
      
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
      
      if (existingAd) {
        // Update existing ad with image data
        const { error } = await supabase
          .from('ad_listings')
          .update({
            featured_image_url: adData.featured_image_url,
            image_urls: adData.image_urls,
            total_views: adData.total_views,
            today_views: adData.today_views,
          })
          .eq('id', existingAd.id)
        
        if (!error) {
          updatedCount++
          if (updatedCount % 100 === 0) {
            console.log(`✓ Updated ${updatedCount} ads with images...`)
          }
        }
      } else {
        // Create new ad
        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)
        
        if (!error) {
          migratedCount++
          if (migratedCount % 100 === 0) {
            console.log(`✓ Migrated ${migratedCount} ads...`)
          }
        } else {
          console.error(`Failed to migrate ad ${post.ID}:`, error.message)
        }
      }
    } catch (error) {
      console.error(`Error migrating ad ${post.ID}:`, error)
    }
  }
  
  console.log(`Successfully migrated ${migratedCount} new ads and updated ${updatedCount} existing ads with images`)
}

// ============================================================================
// STEP 4: Migrate blog posts with images
// ============================================================================

async function migrateBlogPostsWithImages(
  connection: mysql.Connection,
  userMap: Map<number, string>
) {
  console.log('Migrating blog posts with images...')
  
  // Get all blog posts
  const [posts] = await connection.execute(`
    SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
           post_status, post_name, post_type
    FROM wp_posts 
    WHERE post_type = 'post' AND post_status = 'publish'
  `) as [WordPressPost[], any]
  
  // Get featured images for blog posts
  const [featuredImages] = await connection.execute(`
    SELECT p.ID as post_id, pm.meta_value as thumbnail_id, attpm.meta_value as file_path
    FROM wp_posts p
    JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
    JOIN wp_postmeta attpm ON pm.meta_value = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
    WHERE p.post_type = 'post' 
      AND p.post_status = 'publish'
  `) as [any[], any]
  
  console.log(`Found ${posts.length} blog posts, ${featuredImages.length} with featured images`)
  
  let migratedCount = 0
  let updatedCount = 0
  
  for (const post of posts) {
    try {
      // Map author
      const authorId = userMap.get(post.post_author)
      if (!authorId) {
        console.log(`Skipping blog post ${post.ID}: author not found`)
        continue
      }
      
      // Get featured image
      const featuredImage = featuredImages.find(fi => fi.post_id === post.ID)
      const featuredImageUrl = featuredImage ? generateImageUrl(featuredImage.file_path) : null
      
      // Check if this post already exists in Supabase
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('wordpress_post_id', post.ID)
        .single()
      
      const postData = {
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
      }
      
      if (existingPost) {
        // Update existing post with image data
        const { error } = await supabase
          .from('blog_posts')
          .update({
            featured_image_url: postData.featured_image_url,
          })
          .eq('id', existingPost.id)
        
        if (!error) {
          updatedCount++
        }
      } else {
        // Create new post
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData)
        
        if (!error) {
          migratedCount++
        } else {
          console.error(`Failed to migrate blog post ${post.ID}:`, error.message)
        }
      }
    } catch (error) {
      console.error(`Error migrating blog post ${post.ID}:`, error)
    }
  }
  
  console.log(`Successfully migrated ${migratedCount} new blog posts and updated ${updatedCount} existing posts with images`)
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function migrateWithImages() {
  try {
    console.log('🚀 Starting migration with images...')
    
    const connection = await loadWordPressData()
    const userMap = await getUserMap()
    
    // Migrate ad listings with images
    await migrateAdListingsWithImages(connection, userMap)
    
    // Migrate blog posts with images
    await migrateBlogPostsWithImages(connection, userMap)
    
    await connection.end()
    
    console.log('🎉 Migration with images completed!')
    console.log('📊 Check your Supabase Studio at: http://127.0.0.1:54323')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateWithImages()
