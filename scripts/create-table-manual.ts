import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdListingsTableManually() {
  console.log('Creating ad_listings table manually...')
  
  // Try to create the table using a simple insert that should fail gracefully
  // if the table doesn't exist, but will work if it does
  try {
    const { error } = await supabase
      .from('ad_listings')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('Table does not exist, error:', error.message)
      
      // Try to create the table using the REST API
      const createTableResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS ad_listings (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              wordpress_post_id INTEGER,
              title TEXT NOT NULL,
              slug TEXT UNIQUE NOT NULL,
              content TEXT,
              excerpt TEXT,
              status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'sold')),
              kitten_age TEXT,
              kitten_breed TEXT,
              kitten_gender TEXT,
              number_of_kittens INTEGER,
              date_of_birth DATE,
              city TEXT,
              province TEXT,
              country TEXT DEFAULT 'Nederland',
              postal_code TEXT,
              contact_phone TEXT,
              contact_email TEXT,
              vaccinated BOOLEAN,
              chipped BOOLEAN,
              toilet_trained BOOLEAN,
              price DECIMAL(10,2) DEFAULT 0,
              is_free BOOLEAN DEFAULT true,
              marked_as_sold BOOLEAN DEFAULT false,
              is_sought BOOLEAN DEFAULT false,
              total_views INTEGER DEFAULT 0,
              today_views INTEGER DEFAULT 0,
              featured_image_url TEXT,
              image_urls TEXT[],
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              expires_at TIMESTAMPTZ,
              author_id UUID REFERENCES profiles(id) ON DELETE SET NULL
            );
          `
        })
      })
      
      console.log('Create table response:', createTableResponse.status)
      
    } else {
      console.log('✅ Table already exists!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createAdListingsTableManually().catch(console.error)
