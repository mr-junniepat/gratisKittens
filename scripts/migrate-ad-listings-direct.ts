import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateAdListingsDirect() {
  console.log('Starting direct ad listings migration...')
  
  try {
    // Read the JSON file
    console.log('Reading ad_listings_only.json...')
    const jsonData = JSON.parse(fs.readFileSync('ad_listings_only.json', 'utf8'))
    
    // Find the table data section
    const tableData = jsonData.find(item => item.type === 'table' && item.name === 'wp_posts')
    
    if (!tableData) {
      throw new Error('Could not find wp_posts table data in JSON')
    }
    
    const adListings = tableData.data // Migrate ALL ad listings
    console.log(`Migrating ${adListings.length} ad listings`)
    
    // Get existing profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email')
      .limit(1)
    
    const authorId = profiles?.[0]?.id || null
    console.log(`Using author ID: ${authorId}`)
    
    // Migrate the data
    let migratedCount = 0
    let errorCount = 0
    
    for (const post of adListings) {
      try {
        const adData = {
          wordpress_post_id: parseInt(post.ID),
          title: post.post_title || 'Untitled',
          slug: post.post_name || `ad-${post.ID}`,
          content: post.post_content || '',
          excerpt: post.post_excerpt || '',
          status: post.post_status === 'publish' ? 'published' : 'draft',
          kitten_age: null,
          kitten_breed: null,
          kitten_gender: null,
          number_of_kittens: null,
          date_of_birth: null,
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
          featured_image_url: null,
          image_urls: [],
          created_at: post.post_date,
          updated_at: post.post_modified,
          expires_at: null,
          author_id: authorId
        }
        
        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)
        
        if (error) {
          console.error(`Failed to migrate ad ${post.ID}:`, error.message)
          errorCount++
        } else {
          migratedCount++
          if (migratedCount % 20 === 0) {
            console.log(`✓ Migrated ${migratedCount}/${adListings.length} ads...`)
          }
        }
      } catch (error) {
        console.error(`Error migrating ad ${post.ID}:`, error)
        errorCount++
      }
    }
    
    console.log(`\n✅ Migration completed!`)
    console.log(`📊 Successfully migrated: ${migratedCount} ads`)
    console.log(`❌ Errors: ${errorCount} ads`)
    
    if (migratedCount > 0) {
      console.log('\n🎉 Success! Ad listings have been migrated to Supabase!')
      
      // Test the GraphQL API
      console.log('\nTesting GraphQL API...')
      const response = await fetch('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ adListings(limit: 3) { id title createdAt status } }'
        })
      })
      
      const result = await response.json()
      if (result.data?.adListings) {
        console.log('✅ GraphQL API is working!')
        console.log('Sample ads:', result.data.adListings.map(ad => `${ad.title} (${ad.status})`))
      } else {
        console.log('❌ GraphQL API error:', result.errors)
      }
    }
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

migrateAdListingsDirect().catch(console.error)
