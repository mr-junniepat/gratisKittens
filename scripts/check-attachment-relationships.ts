import mysql from 'mysql2/promise'

async function checkAttachmentRelationships() {
  console.log('🔍 Checking attachment relationships...')
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // Check how attachments are linked to posts
    const [attachmentLinks] = await connection.execute(`
      SELECT p.post_parent, COUNT(*) as attachment_count
      FROM wp_posts p
      WHERE p.post_type = 'attachment'
        AND p.post_parent > 0
      GROUP BY p.post_parent
      ORDER BY attachment_count DESC
      LIMIT 10
    `) as [any[], any]

    console.log('\n📎 Posts with most attachments:')
    for (const row of attachmentLinks) {
      console.log(`  - Post ID ${row.post_parent}: ${row.attachment_count} attachments`)
    }

    // Check ad listings specifically
    const [adAttachments] = await connection.execute(`
      SELECT p.ID, p.post_title, att.ID as attachment_id, att.post_title as attachment_title, 
             att.post_mime_type, pm.meta_value as file_path
      FROM wp_posts p
      JOIN wp_posts att ON att.post_parent = p.ID
      JOIN wp_postmeta pm ON att.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND att.post_type = 'attachment'
      LIMIT 10
    `) as [any[], any]

    console.log('\n🐱 Ad listings with attachments:')
    for (const row of adAttachments) {
      console.log(`  - Ad: ${row.post_title} (ID: ${row.ID})`)
      console.log(`    Attachment: ${row.attachment_title} (${row.post_mime_type})`)
      console.log(`    File: ${row.file_path}`)
      console.log('')
    }

    // Check for featured images (thumbnail_id)
    const [featuredImages] = await connection.execute(`
      SELECT p.ID, p.post_title, pm.meta_value as thumbnail_id,
             att.post_title as attachment_title, attpm.meta_value as file_path
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
      JOIN wp_posts att ON att.ID = pm.meta_value
      JOIN wp_postmeta attpm ON att.ID = attpm.post_id AND attpm.meta_key = '_wp_attached_file'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
      LIMIT 5
    `) as [any[], any]

    console.log('\n🖼️ Featured images for ad listings:')
    for (const row of featuredImages) {
      console.log(`  - Ad: ${row.post_title} (ID: ${row.ID})`)
      console.log(`    Featured image: ${row.attachment_title}`)
      console.log(`    File: ${row.file_path}`)
      console.log('')
    }

    // Count total images for ad listings
    const [adImageCount] = await connection.execute(`
      SELECT COUNT(*) as total_images
      FROM wp_posts p
      JOIN wp_posts att ON att.post_parent = p.ID
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
        AND att.post_type = 'attachment'
        AND att.post_mime_type LIKE 'image/%'
    `) as [any[], any]

    console.log(`\n📊 Total images for ad listings: ${adImageCount[0]?.total_images || 0}`)

    // Count featured images
    const [featuredCount] = await connection.execute(`
      SELECT COUNT(*) as featured_count
      FROM wp_posts p
      JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
      WHERE p.post_type = 'ad_listing' 
        AND p.post_status = 'publish'
    `) as [any[], any]

    console.log(`📊 Ad listings with featured images: ${featuredCount[0]?.featured_count || 0}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

checkAttachmentRelationships().catch(console.error)
