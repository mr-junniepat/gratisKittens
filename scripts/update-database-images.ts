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

async function updateDatabaseImages() {
  console.log('🔄 Updating database with migrated images...')

  // Get all blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, content')

  if (error) {
    console.error('Error fetching blog posts:', error)
    return
  }

  console.log(`📝 Processing ${posts?.length || 0} blog posts...`)

  // Regex to find image URLs in content
  const imageRegex = /https:\/\/gratiskittens\.com\/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi

  for (const post of posts || []) {
    if (!post.content) continue

    const imageUrls: string[] = []
    let match

    // Find all image URLs in content
    while ((match = imageRegex.exec(post.content)) !== null) {
      const originalUrl = match[0]
      
      // Convert to Supabase Storage URL
      const fileName = generateFileName(originalUrl, post.id, `content-${imageUrls.length}`)
      const newUrl = `http://127.0.0.1:54321/storage/v1/object/public/blog-images/${fileName}`
      
      imageUrls.push(newUrl)
    }

    if (imageUrls.length > 0) {
      // Update the blog post with image URLs
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          featuredImageUrl: imageUrls[0], // Use first image as featured
          imageUrls: imageUrls
        })
        .eq('id', post.id)

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError)
      } else {
        console.log(`✅ Updated ${post.title} with ${imageUrls.length} images`)
      }
    }
  }

  console.log('🎉 Database image URLs updated!')
}

function generateFileName(originalUrl: string, recordId: string, type: string): string {
  const urlParts = originalUrl.split('/')
  const originalFileName = urlParts[urlParts.length - 1]
  const extension = originalFileName.split('.').pop()
  const timestamp = Date.now()
  const hash = Math.random().toString(36).substring(2, 10)
  
  return `${recordId}-${type}-${timestamp}-${hash}.${extension}`
}

// Run the update
updateDatabaseImages().catch(console.error)
