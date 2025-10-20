import mysql from 'mysql2/promise'

async function check2025Posts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })
  
  try {
    const [posts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM wp_posts 
      WHERE post_type = 'post' 
      AND post_status = 'publish' 
      AND post_date >= '2025-01-01'
    `) as [any[], any]
    
    console.log(`📊 Blog posts from 2025: ${posts[0].count}`)
    
    if (posts[0].count > 0) {
      const [samplePosts] = await connection.execute(`
        SELECT post_title, post_date 
        FROM wp_posts 
        WHERE post_type = 'post' 
        AND post_status = 'publish' 
        AND post_date >= '2025-01-01'
        ORDER BY post_date DESC
        LIMIT 5
      `) as [any[], any]
      
      console.log('\n📝 Sample 2025 posts:')
      for (const post of samplePosts) {
        console.log(`- ${post.post_title} (${post.post_date})`)
      }
    }
  } finally {
    await connection.end()
  }
}

check2025Posts()
