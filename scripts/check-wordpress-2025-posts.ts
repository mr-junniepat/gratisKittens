import mysql from 'mysql2/promise'

async function checkWordPress2025Posts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'password',
    database: 'gratiskittens_com'
  })

  try {
    console.log('Checking WordPress 2025 posts...')
    
    const [rows] = await connection.execute(`
      SELECT ID, post_title, post_date, post_status, post_type
      FROM wp_posts 
      WHERE post_type = 'ad_listing' 
      AND post_date LIKE '2025%'
      ORDER BY post_date DESC
      LIMIT 20
    `)
    
    console.log(`Found ${rows.length} 2025 posts in WordPress:`)
    rows.forEach((row: any) => {
      console.log(`- ${row.post_title} (${row.post_date}) [${row.post_status}]`)
    })
    
    // Also check for posts from September 2025 specifically
    const [septRows] = await connection.execute(`
      SELECT ID, post_title, post_date, post_status
      FROM wp_posts 
      WHERE post_type = 'ad_listing' 
      AND post_date LIKE '2025-09%'
      ORDER BY post_date DESC
    `)
    
    console.log(`\nFound ${septRows.length} September 2025 posts:`)
    septRows.forEach((row: any) => {
      console.log(`- ${row.post_title} (${row.post_date})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

checkWordPress2025Posts()
