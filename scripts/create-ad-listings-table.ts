import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdListingsTable() {
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
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (error) {
      console.error('Error creating table:', error)
    } else {
      console.log('✅ ad_listings table created successfully')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

createAdListingsTable().catch(console.error)
