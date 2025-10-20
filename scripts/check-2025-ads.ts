import mysql from 'mysql2/promise'

async function check2025AdListings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })
  
  try {
    const [ads] = await connection.execute(`
      SELECT ID, post_title, post_date, post_status
      FROM wp_posts 
      WHERE post_type = 'ad_listing' 
      AND post_status = 'publish'
      AND post_date >= '2025-01-01'
      ORDER BY post_date DESC
    `) as [any[], any]
    
    console.log(`📊 WordPress ad listings from 2025: ${ads.length}`)
    
    if (ads.length > 0) {
      console.log('\n📋 2025 ad listings in WordPress:')
      for (const ad of ads) {
        console.log(`- ${ad.post_title} (${ad.post_date}) - ID: ${ad.ID}`)
      }
    }
  } finally {
    await connection.end()
  }
}

check2025AdListings()
