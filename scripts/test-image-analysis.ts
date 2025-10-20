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

async function testImageAnalysis() {
  console.log('🔍 Analyzing images for migration...')
  
  const images: any[] = []
  const processedUrls = new Set<string>()

  // Get ad listing images
  const { data: ads, error: adError } = await supabase
    .from('ad_listings')
    .select('id, title, featured_image_url, image_urls')
    .not('featured_image_url', 'is', null)

  if (adError) {
    console.error('Error fetching ad listings:', adError)
  } else {
    console.log(`📋 Processing ${ads?.length || 0} ad listings...`)
    
    for (const ad of ads || []) {
      // Featured image
      if (ad.featured_image_url && !processedUrls.has(ad.featured_image_url)) {
        if (ad.featured_image_url.includes('wp-content/uploads/') && ad.featured_image_url.includes('gratiskittens.com')) {
          images.push({
            type: 'ad-featured',
            recordId: ad.id,
            title: ad.title,
            url: ad.featured_image_url,
            sftpPath: ad.featured_image_url.replace('https://gratiskittens.com', '')
          })
          processedUrls.add(ad.featured_image_url)
        }
      }

      // Gallery images
      if (ad.image_urls && Array.isArray(ad.image_urls)) {
        for (let i = 0; i < ad.image_urls.length; i++) {
          const imageUrl = ad.image_urls[i]
          if (imageUrl && !processedUrls.has(imageUrl)) {
            if (imageUrl.includes('wp-content/uploads/') && imageUrl.includes('gratiskittens.com')) {
              images.push({
                type: 'ad-gallery',
                recordId: ad.id,
                title: ad.title,
                url: imageUrl,
                sftpPath: imageUrl.replace('https://gratiskittens.com', ''),
                index: i
              })
              processedUrls.add(imageUrl)
            }
          }
        }
      }
    }
  }

  // Get blog post images
  const { data: posts, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, featured_image_url, content')

  if (postError) {
    console.error('Error fetching blog posts:', postError)
  } else {
    console.log(`📝 Processing ${posts?.length || 0} blog posts...`)
    
    for (const post of posts || []) {
      // Featured image
      if (post.featured_image_url && !processedUrls.has(post.featured_image_url)) {
        if (post.featured_image_url.includes('wp-content/uploads/') && post.featured_image_url.includes('gratiskittens.com')) {
          images.push({
            type: 'blog-featured',
            recordId: post.id,
            title: post.title,
            url: post.featured_image_url,
            sftpPath: post.featured_image_url.replace('https://gratiskittens.com', '')
          })
          processedUrls.add(post.featured_image_url)
        }
      }

      // Content images
      if (post.content) {
        const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
        const contentImages = []
        let match
        
        while ((match = imageRegex.exec(post.content)) !== null) {
          contentImages.push(match[1])
        }

        for (let i = 0; i < contentImages.length; i++) {
          const imageUrl = contentImages[i]
          if (imageUrl && !processedUrls.has(imageUrl)) {
            if (imageUrl.includes('wp-content/uploads/') && imageUrl.includes('gratiskittens.com')) {
              images.push({
                type: 'blog-content',
                recordId: post.id,
                title: post.title,
                url: imageUrl,
                sftpPath: imageUrl.replace('https://gratiskittens.com', ''),
                index: i
              })
              processedUrls.add(imageUrl)
            }
          }
        }
      }
    }
  }

  console.log(`\n📊 Found ${images.length} unique WordPress images to migrate:`)
  console.log(`  - Ad featured images: ${images.filter(img => img.type === 'ad-featured').length}`)
  console.log(`  - Ad gallery images: ${images.filter(img => img.type === 'ad-gallery').length}`)
  console.log(`  - Blog featured images: ${images.filter(img => img.type === 'blog-featured').length}`)
  console.log(`  - Blog content images: ${images.filter(img => img.type === 'blog-content').length}`)

  console.log('\n📝 Sample images to migrate:')
  images.slice(0, 10).forEach((img, i) => {
    console.log(`${i + 1}. ${img.type} - ${img.title}`)
    console.log(`   URL: ${img.url}`)
    console.log(`   SFTP: ${img.sftpPath}`)
    console.log('')
  })

  // Group by directory
  const dirGroups = new Map<string, number>()
  images.forEach(img => {
    const dir = img.sftpPath.split('/').slice(0, -1).join('/') || '/'
    dirGroups.set(dir, (dirGroups.get(dir) || 0) + 1)
  })

  console.log('\n📁 Images by directory:')
  for (const [dir, count] of dirGroups) {
    console.log(`  ${dir}: ${count} images`)
  }

  return images
}

testImageAnalysis().catch(console.error)
