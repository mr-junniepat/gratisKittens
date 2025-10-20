import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function freshAdListingsMigration() {
  console.log('Starting fresh ad_listings migration from WordPress MySQL...')
  
  // Connect to WordPress MySQL
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'gratiskittens_com'
  })

  try {
    // Get all ad_listing posts from WordPress
    console.log('Fetching ad listings from WordPress...')
    const [posts] = await connection.execute(`
      SELECT 
        p.ID,
        p.post_title,
        p.post_name,
        p.post_content,
        p.post_excerpt,
        p.post_date,
        p.post_status,
        p.post_modified,
        u.user_login,
        u.user_email,
        u.display_name
      FROM wp_posts p
      LEFT JOIN wp_users u ON p.post_author = u.ID
      WHERE p.post_type = 'ad_listing'
      AND p.post_status IN ('publish', 'draft', 'private')
      ORDER BY p.post_date DESC
    `)
    
    console.log(`Found ${posts.length} ad listings in WordPress`)
    
    // Get post meta for each post
    const postsWithMeta = []
    for (const post of posts) {
      const [metaRows] = await connection.execute(`
        SELECT meta_key, meta_value 
        FROM wp_postmeta 
        WHERE post_id = ? 
        AND meta_key LIKE 'cp_%'
      `, [post.ID])
      
      const metaObj = {}
      metaRows.forEach(row => {
        metaObj[row.meta_key] = row.meta_value
      })
      
      postsWithMeta.push({
        ...post,
        meta: metaObj
      })
    }
    
    console.log('Processing posts...')
    
    // Clear existing ad_listings
    console.log('Clearing existing ad_listings...')
    const { error: deleteError } = await supabase
      .from('ad_listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (deleteError) {
      console.error('Error clearing table:', deleteError)
    } else {
      console.log('✅ Cleared existing ad_listings')
    }
    
    // Migrate posts
    let migratedCount = 0
    let errorCount = 0
    
    for (const post of postsWithMeta) {
      try {
        // Get or create author
        let authorId = null
        if (post.user_login) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', post.user_login)
            .single()
          
          if (existingProfile) {
            authorId = existingProfile.id
          } else {
            // Create profile for this user
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                username: post.user_login,
                email: post.user_email || `${post.user_login}@example.com`,
                display_name: post.display_name || post.user_login,
                needs_password_reset: true,
                auth_user_created: false
              })
              .select('id')
              .single()
            
            if (profileError) {
              console.error(`Error creating profile for ${post.user_login}:`, profileError)
              continue
            }
            authorId = newProfile.id
          }
        }
        
        // Map WordPress post to Supabase ad_listing
        const adData = {
          title: post.post_title || 'Untitled',
          slug: post.post_name || `ad-${post.ID}`,
          content: post.post_content || '',
          excerpt: post.post_excerpt || '',
          featured_image_url: null, // Will be populated later
          image_urls: [], // Will be populated later
          
          // Location from meta
          city: post.meta.cp_city || null,
          province: post.meta.cp_state || null,
          country: post.meta.cp_country || 'Nederland',
          postal_code: post.meta.cp_zipcode || null,
          
          // Contact from meta
          contact_phone: post.meta.cp_phone || null,
          contact_email: post.meta.cp_email || null,
          
          // Health from meta
          vaccinated: post.meta.cp_vaccinated === 'yes',
          chipped: post.meta.cp_chipped === 'yes',
          toilet_trained: post.meta.cp_zindelijk === 'yes',
          
          // Pricing from meta
          price: post.meta.cp_price ? parseFloat(post.meta.cp_price) : 0,
          is_free: !post.meta.cp_price || post.meta.cp_price === '0',
          marked_as_sold: post.meta.cp_sold === 'yes',
          is_sought: post.meta.cp_sought === 'yes',
          
          // Analytics from meta
          total_views: post.meta.cp_total_count ? parseInt(post.meta.cp_total_count) : 0,
          today_views: post.meta.cp_daily_count ? parseInt(post.meta.cp_daily_count) : 0,
          
          // Dates - use EXACT WordPress dates
          created_at: post.post_date,
          updated_at: post.post_modified,
          published_at: post.post_status === 'publish' ? post.post_date : null,
          status: post.post_status === 'publish' ? 'published' : post.post_status,
          author_id: authorId,
          
          // WordPress reference
          wordpress_id: post.ID,
          wordpress_meta: post.meta
        }
        
        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)
        
        if (error) {
          console.error(`Failed to migrate ad ${post.ID}:`, error.message)
          errorCount++
        } else {
          migratedCount++
          if (migratedCount % 50 === 0) {
            console.log(`✓ Migrated ${migratedCount}/${posts.length} ads...`)
          }
        }
      } catch (error) {
        console.error(`Error migrating ad ${post.ID}:`, error)
        errorCount++
      }
    }
    
    console.log(`\n✅ Fresh migration completed!`)
    console.log(`📊 Successfully migrated: ${migratedCount} ads`)
    console.log(`❌ Errors: ${errorCount} ads`)
    
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await connection.end()
  }
}

freshAdListingsMigration().catch(console.error)
