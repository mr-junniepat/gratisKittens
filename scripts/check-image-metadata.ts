import mysql from 'mysql2/promise'

async function checkImageMetadata() {
  console.log('🔍 Checking for image metadata in WordPress data...')
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // Check for image-related meta keys
    const [metaKeys] = await connection.execute(`
      SELECT meta_key, COUNT(*) as count
      FROM wp_postmeta 
      WHERE meta_key LIKE '%image%' 
         OR meta_key LIKE '%photo%'
         OR meta_key LIKE '%gallery%'
         OR meta_key LIKE '%featured%'
         OR meta_key LIKE '%thumbnail%'
         OR meta_key LIKE '%attachment%'
      GROUP BY meta_key
      ORDER BY count DESC
    `) as [any[], any]

    console.log('\n📸 Image-related meta keys:')
    for (const row of metaKeys) {
      console.log(`  - ${row.meta_key}: ${row.count} entries`)
    }

    // Check for any meta keys that might contain URLs
    const [urlMetaKeys] = await connection.execute(`
      SELECT meta_key, COUNT(*) as count
      FROM wp_postmeta 
      WHERE meta_value LIKE 'http%' 
         OR meta_value LIKE 'www.%'
         OR meta_value LIKE '%.jpg'
         OR meta_value LIKE '%.png'
         OR meta_value LIKE '%.gif'
         OR meta_value LIKE '%.jpeg'
      GROUP BY meta_key
      ORDER BY count DESC
      LIMIT 20
    `) as [any[], any]

    console.log('\n🌐 Meta keys with URLs or image extensions:')
    for (const row of urlMetaKeys) {
      console.log(`  - ${row.meta_key}: ${row.count} entries`)
    }

    // Sample some image URLs
    const [sampleImages] = await connection.execute(`
      SELECT meta_key, meta_value
      FROM wp_postmeta 
      WHERE meta_value LIKE '%.jpg' 
         OR meta_value LIKE '%.png'
         OR meta_value LIKE '%.gif'
         OR meta_value LIKE '%.jpeg'
         OR (meta_value LIKE 'http%' AND meta_value LIKE '%image%')
      LIMIT 10
    `) as [any[], any]

    console.log('\n📝 Sample image data:')
    for (const row of sampleImages) {
      console.log(`  - ${row.meta_key}: ${row.meta_value.substring(0, 100)}...`)
    }

    // Check specific ad listing posts for image data
    const [adImageData] = await connection.execute(`
      SELECT p.ID, p.post_title, pm.meta_key, pm.meta_value
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND (pm.meta_value LIKE '%.jpg' 
             OR pm.meta_value LIKE '%.png'
             OR pm.meta_value LIKE '%.gif'
             OR pm.meta_value LIKE '%.jpeg'
             OR pm.meta_key LIKE '%image%')
      LIMIT 10
    `) as [any[], any]

    console.log('\n🐱 Ad listing image data:')
    for (const row of adImageData) {
      console.log(`  - Post ${row.ID} (${row.post_title}): ${row.meta_key} = ${row.meta_value.substring(0, 80)}...`)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

checkImageMetadata().catch(console.error)
