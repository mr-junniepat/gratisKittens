import mysql from 'mysql2/promise'

async function checkWordPressStatuses() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })
  
  try {
    const [statuses] = await connection.execute(`
      SELECT DISTINCT post_status, COUNT(*) as count
      FROM wp_posts 
      WHERE post_type = 'ad_listing' 
      AND post_date >= '2020-01-01'
      GROUP BY post_status
      ORDER BY count DESC
    `) as [any[], any]
    
    console.log('WordPress ad listing statuses:')
    for (const status of statuses) {
      console.log(`- ${status.post_status}: ${status.count} posts`)
    }
  } finally {
    await connection.end()
  }
}

checkWordPressStatuses()
