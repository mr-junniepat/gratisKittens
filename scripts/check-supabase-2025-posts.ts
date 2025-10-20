import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSupabase2025Posts() {
  console.log('🔍 Checking Supabase for 2025 blog posts...')

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, created_at, published_at, wordpress_post_id')
    .gte('created_at', '2025-01-01T00:00:00Z')
    .lt('created_at', '2026-01-01T00:00:00Z')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching 2025 blog posts from Supabase:', error)
    return
  }

  console.log(`📊 Supabase blog posts from 2025: ${posts?.length || 0}`)

  if (posts && posts.length > 0) {
    console.log('\n📝 2025 blog posts in Supabase:')
    posts.forEach(post => {
      console.log(`- ${post.title} (${post.created_at}) - WP ID: ${post.wordpress_post_id}`)
    })
  }
}

checkSupabase2025Posts()
