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

async function extractImagesFromContent() {
  console.log('🔄 Extracting image URLs from blog post content...')

  // Get all blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, content')

  if (error) {
    console.error('Error fetching blog posts:', error)
    return
  }

  console.log(`📝 Processing ${posts?.length || 0} blog posts...`)

  // Regex to find Supabase Storage image URLs in content
  const imageRegex = /http:\/\/127\.0\.0\.1:54321\/storage\/v1\/object\/public\/blog-images\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi

  let updatedCount = 0

  for (const post of posts || []) {
    if (!post.content) continue

    const imageUrls: string[] = []
    let match

    // Find all image URLs in content
    while ((match = imageRegex.exec(post.content)) !== null) {
      imageUrls.push(match[0])
    }

    if (imageUrls.length > 0) {
      // Update the blog post with image URLs
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          featured_image_url: imageUrls[0] // Use first image as featured
        })
        .eq('id', post.id)

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError)
      } else {
        console.log(`✅ Updated "${post.title}" with ${imageUrls.length} images`)
        updatedCount++
      }
    }
  }

  console.log(`🎉 Extracted images from ${updatedCount} blog posts!`)
}

// Run the extraction
extractImagesFromContent().catch(console.error)
