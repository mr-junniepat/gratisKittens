import mysql from 'mysql2/promise'

async function checkWordPressImages() {
  console.log('🔍 Checking WordPress database for images...')
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  // Check posts with images
  const [posts] = await connection.execute(`
    SELECT ID, post_title, post_content 
    FROM wp_posts 
    WHERE post_type = 'post' 
    AND post_status = 'publish'
    AND post_content LIKE '%wp-content/uploads%'
    LIMIT 5
  `)

  console.log(`📝 Found ${posts.length} posts with images:`)
  
  for (const post of posts) {
    console.log(`\n📄 Post: ${post.post_title}`)
    console.log(`ID: ${post.ID}`)
    
    // Extract image URLs
    const imageRegex = /https:\/\/gratiskittens\.com\/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi
    const matches = post.post_content.match(imageRegex)
    
    if (matches) {
      console.log(`🖼️ Images found: ${matches.length}`)
      matches.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`)
      })
    } else {
      console.log('❌ No images found')
    }
  }

  await connection.end()
}

checkWordPressImages().catch(console.error)
