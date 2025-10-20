import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdListingsTableDirectly() {
  console.log('Creating ad_listings table using direct SQL...')
  
  // Use the REST API to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    },
    body: JSON.stringify({
      sql: `
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
    })
  })
  
  if (response.ok) {
    console.log('✅ Table created successfully')
  } else {
    const error = await response.text()
    console.log('Error creating table:', error)
  }
}

createAdListingsTableDirectly().catch(console.error)
