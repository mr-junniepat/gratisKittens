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

async function update2025PostDates() {
  console.log('🔄 Updating 2025 post dates...')
  
  // Connect to MySQL
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })
  
  try {
    // Get WordPress posts from 2025
    const [wpPosts] = await connection.execute(`
      SELECT ID, post_date, post_type
      FROM wp_posts 
      WHERE post_type IN ('post', 'ad_listing')
      AND post_status = 'publish'
      AND post_date >= '2025-01-01'
      ORDER BY post_date DESC
    `) as [any[], any]
    
    console.log(`📊 Found ${wpPosts.length} WordPress posts from 2025`)
    
    let updatedCount = 0
    
    for (const wpPost of wpPosts) {
      try {
        if (wpPost.post_type === 'post') {
          // Update blog post date
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ created_at: wpPost.post_date })
            .eq('wordpress_post_id', wpPost.ID)
          
          if (!updateError) {
            updatedCount++
            console.log(`✅ Updated blog post ${wpPost.ID} date to ${wpPost.post_date}`)
          } else {
            console.error(`❌ Failed to update blog post ${wpPost.ID}:`, updateError.message)
          }
        } else if (wpPost.post_type === 'ad_listing') {
          // Update ad listing date
          const { error: updateError } = await supabase
            .from('ad_listings')
            .update({ created_at: wpPost.post_date })
            .eq('wordpress_post_id', wpPost.ID)
          
          if (!updateError) {
            updatedCount++
            console.log(`✅ Updated ad listing ${wpPost.ID} date to ${wpPost.post_date}`)
          } else {
            console.error(`❌ Failed to update ad listing ${wpPost.ID}:`, updateError.message)
          }
        }
      } catch (error) {
        console.error(`❌ Error updating post ${wpPost.ID}:`, error)
      }
    }
    
    console.log(`\n🎉 Date update complete: ${updatedCount} posts updated`)
    
  } finally {
    await connection.end()
  }
}

update2025PostDates()
