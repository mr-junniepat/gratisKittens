-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  wordpress_user_id INTEGER, -- for migration reference
  needs_password_reset BOOLEAN DEFAULT false,
  auth_user_created BOOLEAN DEFAULT false, -- track if Supabase Auth user was created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- AD LISTINGS (Kitten Classifieds)
-- ============================================================================

CREATE TABLE ad_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_post_id INTEGER, -- for migration reference
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'sold')),
  
  -- Kitten Details (only essential fields)
  kitten_age TEXT,
  kitten_breed TEXT,
  kitten_gender TEXT,
  number_of_kittens INTEGER,
  date_of_birth DATE,
  
  -- Location
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Nederland',
  postal_code TEXT,
  
  -- Contact
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Health
  vaccinated BOOLEAN,
  chipped BOOLEAN,
  toilet_trained BOOLEAN,
  
  -- Pricing & Status
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  marked_as_sold BOOLEAN DEFAULT false,
  is_sought BOOLEAN DEFAULT false, -- "looking for" ads
  
  -- Analytics
  total_views INTEGER DEFAULT 0,
  today_views INTEGER DEFAULT 0,
  
  -- Media
  featured_image_url TEXT,
  image_urls TEXT[], -- array of image URLs
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Author
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_ad_listings_slug ON ad_listings(slug);
CREATE INDEX idx_ad_listings_author ON ad_listings(author_id);
CREATE INDEX idx_ad_listings_created ON ad_listings(created_at DESC);
CREATE INDEX idx_ad_listings_city ON ad_listings(city);
CREATE INDEX idx_ad_listings_status ON ad_listings(status);

-- Enable RLS
ALTER TABLE ad_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published ads"
  ON ad_listings FOR SELECT
  USING (status = 'published' AND marked_as_sold = false);

CREATE POLICY "Authenticated users can insert ads"
  ON ad_listings FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own ads"
  ON ad_listings FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own ads"
  ON ad_listings FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================================
-- BLOG POSTS
-- ============================================================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_post_id INTEGER,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Author
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can insert posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- ============================================================================
-- FAVORITES (User saved ads)
-- ============================================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ad_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_ad_listings_updated_at
  BEFORE UPDATE ON ad_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
