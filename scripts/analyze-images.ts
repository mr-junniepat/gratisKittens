import { createClient } from '@supabase/supabase-js'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function analyzeImages() {
  console.log('🔍 Analyzing images in database...')

  // Analyze ad listing images
  const { data: ads, error: adError } = await supabase
    .from('ad_listings')
    .select('id, title, featured_image_url, image_urls')
    .not('featured_image_url', 'is', null)

  if (adError) {
    console.error('Error fetching ad listings:', adError)
    return
  }

  console.log(`\n📊 Ad Listings with images: ${ads?.length || 0}`)

  const adImages = new Set<string>()
  let featuredCount = 0
  let galleryCount = 0

  for (const ad of ads || []) {
    if (ad.featured_image_url && ad.featured_image_url.startsWith('http')) {
      adImages.add(ad.featured_image_url)
      featuredCount++
    }

    if (ad.image_urls && Array.isArray(ad.image_urls)) {
      for (const url of ad.image_urls) {
        if (url && url.startsWith('http')) {
          adImages.add(url)
          galleryCount++
        }
      }
    }
  }

  console.log(`  - Featured images: ${featuredCount}`)
  console.log(`  - Gallery images: ${galleryCount}`)
  console.log(`  - Unique ad images: ${adImages.size}`)

  // Analyze blog post images
  const { data: posts, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, featured_image_url, content')
    .not('featured_image_url', 'is', null)

  if (postError) {
    console.error('Error fetching blog posts:', postError)
    return
  }

  console.log(`\n📊 Blog Posts with images: ${posts?.length || 0}`)

  const blogImages = new Set<string>()
  let blogFeaturedCount = 0
  let blogContentCount = 0

  for (const post of posts || []) {
    if (post.featured_image_url && post.featured_image_url.startsWith('http')) {
      blogImages.add(post.featured_image_url)
      blogFeaturedCount++
    }

    // Extract images from content
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
    const contentImages = []
    let match
    
    while ((match = imageRegex.exec(post.content || '')) !== null) {
      const imageUrl = match[1]
      if (imageUrl && imageUrl.startsWith('http')) {
        blogImages.add(imageUrl)
        blogContentCount++
      }
    }
  }

  console.log(`  - Featured images: ${blogFeaturedCount}`)
  console.log(`  - Content images: ${blogContentCount}`)
  console.log(`  - Unique blog images: ${blogImages.size}`)

  // Show sample URLs
  console.log('\n📝 Sample ad image URLs:')
  Array.from(adImages).slice(0, 5).forEach(url => {
    console.log(`  - ${url}`)
  })

  console.log('\n📝 Sample blog image URLs:')
  Array.from(blogImages).slice(0, 5).forEach(url => {
    console.log(`  - ${url}`)
  })

  // Total summary
  const totalImages = adImages.size + blogImages.size
  console.log(`\n🎯 Total unique images to migrate: ${totalImages}`)

  // Group by domain
  const domainCounts = new Map<string, number>()
  const allImages = [...adImages, ...blogImages]
  
  for (const url of allImages) {
    try {
      const domain = new URL(url).hostname
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)
    } catch {
      // Skip invalid URLs
    }
  }

  console.log('\n🌐 Images by domain:')
  for (const [domain, count] of domainCounts) {
    console.log(`  - ${domain}: ${count} images`)
  }

  // Check WordPress uploads
  const wpImages = allImages.filter(url => url.includes('wp-content/uploads'))
  console.log(`\n📁 WordPress uploads: ${wpImages.length} images`)
  
  if (wpImages.length > 0) {
    console.log('\n📝 Sample WordPress upload paths:')
    wpImages.slice(0, 3).forEach(url => {
      try {
        const urlObj = new URL(url)
        console.log(`  - ${urlObj.pathname}`)
      } catch {
        console.log(`  - ${url}`)
      }
    })
  }
}

analyzeImages().catch(console.error)
