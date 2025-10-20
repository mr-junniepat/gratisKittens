import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateAdListingsFromJSON() {
  console.log('Starting ad listings migration from JSON...')
  
  try {
    // Read the JSON file
    console.log('Reading ad_listings_only.json...')
    const jsonData = JSON.parse(fs.readFileSync('ad_listings_only.json', 'utf8'))
    
    // Find the table data section
    const tableData = jsonData.find(item => item.type === 'table' && item.name === 'wp_posts')
    
    if (!tableData) {
      throw new Error('Could not find wp_posts table data in JSON')
    }
    
    const adListings = tableData.data
    console.log(`Found ${adListings.length} ad listings to migrate`)
    
    // First, create the ad_listings table
    console.log('Creating ad_listings table...')
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ad_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE,
        content TEXT,
        excerpt TEXT,
        featured_image_url TEXT,
        image_urls TEXT[],
        city TEXT,
        province TEXT,
        country TEXT DEFAULT 'Nederland',
        postal_code TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        vaccinated BOOLEAN DEFAULT false,
        chipped BOOLEAN DEFAULT false,
        toilet_trained BOOLEAN DEFAULT false,
        price DECIMAL(10,2) DEFAULT 0,
        is_free BOOLEAN DEFAULT true,
        marked_as_sold BOOLEAN DEFAULT false,
        is_sought BOOLEAN DEFAULT false,
        total_views INTEGER DEFAULT 0,
        today_views INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ,
        status TEXT DEFAULT 'draft',
        author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        wordpress_id TEXT UNIQUE,
        wordpress_meta JSONB DEFAULT '{}'::jsonb
      );
    `
    
    try {
      const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      if (tableError) {
        console.log('Table might already exist or error:', tableError.message)
      } else {
        console.log('✅ ad_listings table created')
      }
    } catch (error) {
      console.log('Error creating table:', error)
    }
    
    // Get all existing profiles to map WordPress authors
    console.log('Fetching existing profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email')
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`)
    }
    
    console.log(`Found ${profiles.length} existing profiles`)
    
    // Create a map of WordPress author IDs to Supabase profile IDs
    // We'll need to map WordPress user IDs to profiles
    // For now, we'll use a fallback approach
    
    // Clear existing ad_listings
    console.log('Clearing existing ad_listings...')
    const { error: deleteError } = await supabase
      .from('ad_listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.log('Error clearing table or table does not exist:', deleteError.message)
    } else {
      console.log('✅ Cleared existing ad_listings')
    }
    
    // Migrate ad listings
    let migratedCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    for (const post of adListings) {
      try {
        // Find a profile to link to (use first profile as fallback for now)
        let authorId = profiles[0]?.id || null
        
        // Try to find a profile by username if we have author info
        if (post.post_author) {
          // For now, we'll use the first profile as a fallback
          // In a real migration, you'd want to map WordPress user IDs to Supabase profiles
          authorId = profiles[0]?.id || null
        }
        
        // Map WordPress post to Supabase ad_listing
        const adData = {
          title: post.post_title || 'Untitled',
          slug: post.post_name || `ad-${post.ID}`,
          content: post.post_content || '',
          excerpt: post.post_excerpt || '',
          featured_image_url: null, // Will be populated later
          image_urls: [], // Will be populated later
          
          // Location - we'll set defaults since we don't have meta data in this JSON
          city: null,
          province: null,
          country: 'Nederland',
          postal_code: null,
          
          // Contact
          contact_phone: null,
          contact_email: null,
          
          // Health defaults
          vaccinated: false,
          chipped: false,
          toilet_trained: false,
          
          // Pricing defaults
          price: 0,
          is_free: true,
          marked_as_sold: false,
          is_sought: false,
          
          // Analytics defaults
          total_views: 0,
          today_views: 0,
          
          // Dates - use EXACT WordPress dates
          created_at: post.post_date,
          updated_at: post.post_modified,
          published_at: post.post_status === 'publish' ? post.post_date : null,
          status: post.post_status === 'publish' ? 'published' : post.post_status,
          author_id: authorId,
          
          // WordPress reference
          wordpress_id: post.ID,
          wordpress_meta: {} // Empty for now, we'll populate from postmeta later
        }
        
        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)
        
        if (error) {
          console.error(`Failed to migrate ad ${post.ID}:`, error.message)
          errorCount++
        } else {
          migratedCount++
          if (migratedCount % 100 === 0) {
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
    console.log(`⏭️ Skipped: ${skippedCount} ads`)
    
    // Show some sample migrated data
    console.log('\nSample migrated ads:')
    const { data: sampleAds } = await supabase
      .from('ad_listings')
      .select('id, title, created_at, status')
      .limit(5)
    
    sampleAds?.forEach((ad, index) => {
      console.log(`${index + 1}. ${ad.title} (${ad.created_at}) [${ad.status}]`)
    })
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

migrateAdListingsFromJSON().catch(console.error)
