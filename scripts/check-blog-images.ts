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

async function checkBlogImages() {
  console.log('🔍 Checking blog post images in database...')

  // Get blog posts with images
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, featured_image_url')
    .not('featured_image_url', 'is', null)
    .limit(5)

  if (error) {
    console.error('❌ Error fetching blog posts:', error)
    return
  }

  console.log(`📊 Found ${posts?.length || 0} blog posts with featured images:`)
  
  for (const post of posts || []) {
    console.log(`\n📄 Post: ${post.title}`)
    console.log(`ID: ${post.id}`)
    console.log(`Featured Image: ${post.featured_image_url}`)
  }

  // Also check total count
  const { count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .not('featured_image_url', 'is', null)

  console.log(`\n📊 Total blog posts with featured images: ${count}`)

  // Check total blog posts
  const { count: totalPosts } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total blog posts: ${totalPosts}`)
}

checkBlogImages()
