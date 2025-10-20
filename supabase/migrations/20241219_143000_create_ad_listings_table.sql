-- Create ad_listings table for fresh migration
CREATE TABLE IF NOT EXISTS ad_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  image_urls TEXT[],
  
  -- Location
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Nederland',
  postal_code TEXT,
  
  -- Contact
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Health
  vaccinated BOOLEAN DEFAULT false,
  chipped BOOLEAN DEFAULT false,
  toilet_trained BOOLEAN DEFAULT false,
  
  -- Pricing
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  marked_as_sold BOOLEAN DEFAULT false,
  is_sought BOOLEAN DEFAULT false,
  
  -- Analytics
  total_views INTEGER DEFAULT 0,
  today_views INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- WordPress reference
  wordpress_id TEXT UNIQUE,
  wordpress_meta JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ad_listings_status ON ad_listings(status);
CREATE INDEX IF NOT EXISTS idx_ad_listings_created_at ON ad_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_listings_author_id ON ad_listings(author_id);
CREATE INDEX IF NOT EXISTS idx_ad_listings_wordpress_id ON ad_listings(wordpress_id);
CREATE INDEX IF NOT EXISTS idx_ad_listings_city ON ad_listings(city);
CREATE INDEX IF NOT EXISTS idx_ad_listings_province ON ad_listings(province);

-- Enable RLS
ALTER TABLE ad_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to published ads" ON ad_listings
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow authenticated users to read their own ads" ON ad_listings
  FOR SELECT USING (auth.uid()::text = author_id::text);

CREATE POLICY "Allow authenticated users to insert their own ads" ON ad_listings
  FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Allow authenticated users to update their own ads" ON ad_listings
  FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Allow authenticated users to delete their own ads" ON ad_listings
  FOR DELETE USING (auth.uid()::text = author_id::text);
