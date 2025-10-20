import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateAdListingsSimple() {
  console.log('Starting simple ad listings migration...')
  
  try {
    // Read the JSON file
    console.log('Reading ad_listings_only.json...')
    const jsonData = JSON.parse(fs.readFileSync('ad_listings_only.json', 'utf8'))
    
    // Find the table data section
    const tableData = jsonData.find(item => item.type === 'table' && item.name === 'wp_posts')
    
    if (!tableData) {
      throw new Error('Could not find wp_posts table data in JSON')
    }
    
    const adListings = tableData.data.slice(0, 10) // Start with just 10 for testing
    console.log(`Testing with ${adListings.length} ad listings`)
    
    // Get existing profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email')
      .limit(1)
    
    const authorId = profiles?.[0]?.id || null
    
    // Try to insert a simple test record first
    console.log('Testing table creation with a simple insert...')
    
    const testAd = {
      title: 'Test Ad',
      slug: 'test-ad',
      content: 'Test content',
      excerpt: 'Test excerpt',
      featured_image_url: null,
      image_urls: [],
      city: null,
      province: null,
      country: 'Nederland',
      postal_code: null,
      contact_phone: null,
      contact_email: null,
      vaccinated: false,
      chipped: false,
      toilet_trained: false,
      price: 0,
      is_free: true,
      marked_as_sold: false,
      is_sought: false,
      total_views: 0,
      today_views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      status: 'published',
      author_id: authorId,
      wordpress_id: 'test-123',
      wordpress_meta: {}
    }
    
    const { error: testError } = await supabase
      .from('ad_listings')
      .insert(testAd)
    
    if (testError) {
      console.error('Test insert failed:', testError.message)
      console.log('This means the table does not exist and needs to be created')
      return
    }
    
    console.log('✅ Test insert successful - table exists!')
    
    // Now migrate the actual data
    let migratedCount = 0
    let errorCount = 0
    
    for (const post of adListings) {
      try {
        const adData = {
          title: post.post_title || 'Untitled',
          slug: post.post_name || `ad-${post.ID}`,
          content: post.post_content || '',
          excerpt: post.post_excerpt || '',
          featured_image_url: null,
          image_urls: [],
          city: null,
          province: null,
          country: 'Nederland',
          postal_code: null,
          contact_phone: null,
          contact_email: null,
          vaccinated: false,
          chipped: false,
          toilet_trained: false,
          price: 0,
          is_free: true,
          marked_as_sold: false,
          is_sought: false,
          total_views: 0,
          today_views: 0,
          created_at: post.post_date,
          updated_at: post.post_modified,
          published_at: post.post_status === 'publish' ? post.post_date : null,
          status: post.post_status === 'publish' ? 'published' : post.post_status,
          author_id: authorId,
          wordpress_id: post.ID,
          wordpress_meta: {}
        }
        
        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)
        
        if (error) {
          console.error(`Failed to migrate ad ${post.ID}:`, error.message)
          errorCount++
        } else {
          migratedCount++
          console.log(`✓ Migrated ad ${post.ID}: ${post.post_title}`)
        }
      } catch (error) {
        console.error(`Error migrating ad ${post.ID}:`, error)
        errorCount++
      }
    }
    
    console.log(`\n✅ Migration completed!`)
    console.log(`📊 Successfully migrated: ${migratedCount} ads`)
    console.log(`❌ Errors: ${errorCount} ads`)
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

migrateAdListingsSimple().catch(console.error)
