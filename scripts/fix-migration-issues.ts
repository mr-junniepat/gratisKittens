import { createClient } from '@supabase/supabase-js'
import mysql from 'mysql2/promise'
import crypto from 'crypto'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================================================
// IMPROVED EMAIL VALIDATION
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  
  // Allow legitimate domains including Belgian ones
  const validDomains = [
    // International
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
    'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'tutanota.com',
    // Belgian domains
    'telenet.be', 'skynet.be', 'hotmail.be', 'live.be', 'outlook.be', 'live.nl',
    // Other legitimate domains
    '163.com', 'msn.com', 'yahoo.be', 'yahoo.nl', 'yahoo.fr', 'yahoo.co.uk',
    'orange.fr', 'free.fr', 'laposte.net', 'wanadoo.fr', 'sfr.fr'
  ]

  // Block only obvious spam patterns
  const suspiciousPatterns = [
    'emailsinfo', 'khabmails', 'serpmenow', 'masum.cc', 'donkihotes', 
    '4serial', 'zopesystems', 'serpmails', 'spamavert'
  ]

  if (suspiciousPatterns.some(pattern => domain.includes(pattern))) {
    return false
  }

  return validDomains.includes(domain)
}

// ============================================================================
// IMPROVED DATE PARSING
// ============================================================================

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '/' || dateStr === '-' || dateStr === '?' || dateStr === '.' || dateStr === 'Nvt' || dateStr === 'Onbekend' || dateStr === 'Maakt niet uit') {
    return null
  }

  // Handle various date formats
  const cleaned = dateStr.trim().toLowerCase()
  
  // Skip obviously invalid dates
  if (cleaned.includes('maakt niet') || cleaned.includes('niet van') || cleaned.includes('onbelangrijk') || 
      cleaned.includes('nvt') || cleaned.includes('onbekend') || cleaned.includes('geen idee') ||
      cleaned.includes('weet ik niet') || cleaned.includes('?') || cleaned.includes('...') ||
      cleaned.includes('zo jong') || cleaned.includes('liefst') || cleaned.includes('max') ||
      cleaned.includes('min') || cleaned.includes('onder de') || cleaned.includes('boven de')) {
    return null
  }

  // Try to parse various date formats
  try {
    // Handle DD-MM-YY format
    if (/^\d{1,2}-\d{1,2}-\d{2}$/.test(cleaned)) {
      const parts = cleaned.split('-')
      const year = parseInt(parts[2]) > 50 ? `19${parts[2]}` : `20${parts[2]}`
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }

    // Handle DD/MM/YY format
    if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(cleaned)) {
      const parts = cleaned.split('/')
      const year = parseInt(parts[2]) > 50 ? `19${parts[2]}` : `20${parts[2]}`
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }

    // Handle YYYY format
    if (/^\d{4}$/.test(cleaned)) {
      const year = parseInt(cleaned)
      if (year >= 1990 && year <= 2030) {
        return `${year}-01-01`
      }
    }

    // Handle month names (convert to approximate dates)
    const monthMap: { [key: string]: string } = {
      'januari': '01', 'februari': '02', 'maart': '03', 'april': '04',
      'mei': '05', 'juni': '06', 'juli': '07', 'augustus': '08',
      'september': '09', 'oktober': '10', 'november': '11', 'december': '12'
    }

    for (const [month, monthNum] of Object.entries(monthMap)) {
      if (cleaned.includes(month)) {
        // Try to extract year
        const yearMatch = cleaned.match(/(\d{4})/)
        if (yearMatch) {
          return `${yearMatch[1]}-${monthNum}-15`
        } else {
          // Default to current year if no year found
          return `2024-${monthNum}-15`
        }
      }
    }

    // Handle age descriptions (convert to approximate birth date)
    if (cleaned.includes('week') || cleaned.includes('maand') || cleaned.includes('jaar')) {
      // Calculate approximate birth date based on age
      const now = new Date()
      if (cleaned.includes('week')) {
        const weeks = parseInt(cleaned.match(/(\d+)/)?.[1] || '8')
        const birthDate = new Date(now.getTime() - (weeks * 7 * 24 * 60 * 60 * 1000))
        return birthDate.toISOString().split('T')[0]
      } else if (cleaned.includes('maand')) {
        const months = parseInt(cleaned.match(/(\d+)/)?.[1] || '3')
        const birthDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
        return birthDate.toISOString().split('T')[0]
      }
    }

  } catch (error) {
    // If parsing fails, return null
    return null
  }

  return null
}

// ============================================================================
// FIX MIGRATION ISSUES
// ============================================================================

async function fixMigrationIssues() {
  console.log('🔧 Fixing migration issues...')
  
  // Connect to WordPress data
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // 1. Fix missing blog posts
    console.log('📝 Fixing missing blog posts...')
    
    const [wpBlogPosts] = await connection.execute(`
      SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
             post_status, post_name, post_type
      FROM wp_posts 
      WHERE post_type = 'post' AND post_status = 'publish'
    `) as [any[], any]

    // Get all profiles to map authors
    const { data: profiles } = await supabase.from('profiles').select('wordpress_user_id, id')
    const profileMap = new Map<number, string>()
    profiles?.forEach(p => {
      if (p.wordpress_user_id) {
        profileMap.set(p.wordpress_user_id, p.id)
      }
    })

    let fixedBlogs = 0
    for (const post of wpBlogPosts) {
      try {
        const authorId = profileMap.get(post.post_author)
        if (!authorId) continue

        // Check if already exists
        const { data: existing } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('wordpress_post_id', post.ID)
          .single()

        if (existing) continue

        // Get featured image
        const [featuredImage] = await connection.execute(`
          SELECT pm.meta_value as thumbnail_id, attpm.meta_value as file_path
          FROM wp_postmeta pm
          LEFT JOIN wp_postmeta attpm ON pm.meta_value = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
          WHERE pm.post_id = ? AND pm.meta_key = '_thumbnail_id'
        `, [post.ID]) as [any[], any]

        const featuredImageUrl = featuredImage.length > 0 && featuredImage[0].file_path 
          ? `https://gratiskittens.com/wp-content/uploads/${featuredImage[0].file_path}`
          : null

        const { error } = await supabase
          .from('blog_posts')
          .insert({
            wordpress_post_id: post.ID,
            title: post.post_title,
            slug: post.post_name,
            content: post.post_content,
            excerpt: post.post_excerpt,
            featured_image_url: featuredImageUrl,
            status: 'published',
            created_at: post.post_date,
            published_at: post.post_date,
            author_id: authorId,
          })

        if (!error) {
          fixedBlogs++
          console.log(`✓ Fixed blog post: ${post.post_title}`)
        } else {
          console.error(`Failed to fix blog post ${post.ID}:`, error.message)
        }
      } catch (error) {
        console.error(`Error fixing blog post ${post.ID}:`, error)
      }
    }

    console.log(`✅ Fixed ${fixedBlogs} blog posts`)

    // 2. Fix missing ad listings with improved date parsing
    console.log('📋 Fixing missing ad listings...')
    
    const [wpAds] = await connection.execute(`
      SELECT ID, post_author, post_date, post_content, post_title, post_excerpt, 
             post_status, post_name, post_type
      FROM wp_posts 
      WHERE post_type = 'ad_listing' AND post_status = 'publish'
    `) as [any[], any]

    // Get all post meta
    const [wpPostMeta] = await connection.execute(`
      SELECT post_id, meta_key, meta_value 
      FROM wp_postmeta 
      WHERE post_id IN (${wpAds.map(p => p.ID).join(',')})
    `) as [any[], any]

    // Get all attachments for ad listings
    const [wpAttachments] = await connection.execute(`
      SELECT att.ID, att.post_parent, att.post_title, att.post_mime_type, pm.meta_value as file_path
      FROM wp_posts att
      JOIN wp_posts p ON att.post_parent = p.ID
      JOIN wp_postmeta pm ON att.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND att.post_type = 'attachment'
        AND att.post_mime_type LIKE 'image/%'
    `) as [any[], any]

    let fixedAds = 0
    for (const post of wpAds) {
      try {
        const authorId = profileMap.get(post.post_author)
        if (!authorId) continue

        // Check if already exists
        const { data: existing } = await supabase
          .from('ad_listings')
          .select('id')
          .eq('wordpress_post_id', post.ID)
          .single()

        if (existing) continue

        // Get all meta for this post
        const meta = wpPostMeta.filter(m => m.post_id === post.ID)
        const metaObj: Record<string, string> = {}
        meta.forEach(m => metaObj[m.meta_key] = m.meta_value)

        // Get attachments for this post
        const postAttachments = wpAttachments.filter(att => att.post_parent === post.ID)
        const imageUrls = postAttachments.map(att => `https://gratiskittens.com/wp-content/uploads/${att.file_path}`)

        // Parse date with improved function
        const parsedDate = parseDate(metaObj.cp_datum_geboorte || '')

        const adData = {
          wordpress_post_id: post.ID,
          title: post.post_title,
          slug: post.post_name,
          content: post.post_content,
          excerpt: post.post_excerpt,

          // Kitten details
          kitten_age: metaObj.cp_age || null,
          kitten_breed: metaObj.cp_breed || null,
          kitten_gender: metaObj.cp_gender || null,
          number_of_kittens: metaObj.cp_aantal_kittens ? parseInt(metaObj.cp_aantal_kittens) : null,
          date_of_birth: parsedDate,

          // Location
          city: metaObj.cp_city || null,
          province: metaObj.cp_state || null,
          country: metaObj.cp_country || 'Nederland',
          postal_code: metaObj.cp_zipcode || null,

          // Contact
          contact_phone: metaObj.cp_phone || null,
          contact_email: metaObj.cp_email || null,

          // Health
          vaccinated: metaObj.cp_vaccinated === 'yes',
          chipped: metaObj.cp_chipped === 'yes',
          toilet_trained: metaObj.cp_zindelijk === 'yes',

          // Pricing
          price: metaObj.cp_price ? parseFloat(metaObj.cp_price) : 0,
          is_free: !metaObj.cp_price || metaObj.cp_price === '0',
          marked_as_sold: metaObj.cp_sold === 'yes',
          is_sought: metaObj.cp_sought === 'yes',

          // Analytics
          total_views: metaObj.cp_total_count ? parseInt(metaObj.cp_total_count) : 0,
          today_views: metaObj.cp_daily_count ? parseInt(metaObj.cp_daily_count) : 0,

          // Images
          featured_image_url: null, // Will be set separately
          image_urls: imageUrls.length > 0 ? imageUrls : null,

          // Metadata
          created_at: post.post_date,
          status: 'published',
          author_id: authorId,
        }

        const { error } = await supabase
          .from('ad_listings')
          .insert(adData)

        if (!error) {
          fixedAds++
          if (fixedAds % 100 === 0) {
            console.log(`✓ Fixed ${fixedAds} ads...`)
          }
        } else {
          console.error(`Failed to fix ad ${post.ID}:`, error.message)
        }
      } catch (error) {
        console.error(`Error fixing ad ${post.ID}:`, error)
      }
    }

    console.log(`✅ Fixed ${fixedAds} ad listings`)

    // 3. Add featured images to existing ads
    console.log('🖼️ Adding featured images to existing ads...')
    
    const [wpFeaturedImages] = await connection.execute(`
      SELECT p.ID as post_id, pm.meta_value as thumbnail_id, attpm.meta_value as file_path
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
      JOIN wp_postmeta attpm ON pm.meta_value = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
    `) as [any[], any]

    let updatedImages = 0
    for (const featuredImage of wpFeaturedImages) {
      try {
        const featuredImageUrl = `https://gratiskittens.com/wp-content/uploads/${featuredImage.file_path}`
        
        const { error } = await supabase
          .from('ad_listings')
          .update({ featured_image_url: featuredImageUrl })
          .eq('wordpress_post_id', featuredImage.post_id)

        if (!error) {
          updatedImages++
        } else {
          console.error(`Failed to update featured image for ad ${featuredImage.post_id}:`, error.message)
        }
      } catch (error) {
        console.error(`Error updating featured image for ad ${featuredImage.post_id}:`, error)
      }
    }

    console.log(`✅ Updated ${updatedImages} featured images`)

    console.log('\n🎉 Migration fixes completed!')
    
    // Final counts
    const { count: finalProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: finalAds } = await supabase.from('ad_listings').select('*', { count: 'exact', head: true })
    const { count: finalBlogs } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true })

    console.log(`📊 Final counts:`)
    console.log(`  - Users: ${finalProfiles}`)
    console.log(`  - Ad listings: ${finalAds}`)
    console.log(`  - Blog posts: ${finalBlogs}`)

  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await connection.end()
  }
}

fixMigrationIssues().catch(console.error)
