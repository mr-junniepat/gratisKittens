import mysql from 'mysql2/promise'

async function analyzeFilteredUsers() {
  console.log('🔍 Analyzing why users were filtered out...')
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'wordpress_temp'
  })

  try {
    // Get all WordPress users
    const [allUsers] = await connection.execute(`
      SELECT ID, user_login, user_email, display_name, user_registered
      FROM wp_users
      WHERE user_email IS NOT NULL AND user_email != ''
      ORDER BY ID
    `) as [any[], any]

    console.log(`Total WordPress users with emails: ${allUsers.length}`)

    // Check email validation
    function isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      if (!emailRegex.test(email)) return false
      
      const domain = email.split('@')[1]?.toLowerCase()
      
      // Only allow well-known legitimate domains
      const validDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
        'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'tutanota.com'
      ]

      // Block suspicious patterns
      const suspiciousPatterns = [
        'emailsinfo', 'bloger', 'masum', 'perfsoundmiss', 'temp', 'fake', 'spam',
        'disposable', 'throwaway', '10minutemail', 'guerrillamail'
      ]

      if (suspiciousPatterns.some(pattern => domain.includes(pattern))) {
        return false
      }

      return validDomains.includes(domain)
    }

    const validUsers = []
    const invalidUsers = []
    const domainCounts = new Map<string, number>()

    for (const user of allUsers) {
      const domain = user.user_email.split('@')[1]?.toLowerCase()
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)

      if (isValidEmail(user.user_email)) {
        validUsers.push(user)
      } else {
        invalidUsers.push(user)
      }
    }

    console.log(`\n📊 Email Validation Results:`)
    console.log(`Valid emails: ${validUsers.length}`)
    console.log(`Invalid emails: ${invalidUsers.length}`)
    console.log(`Filtered out: ${((invalidUsers.length / allUsers.length) * 100).toFixed(1)}%`)

    // Show top domains
    console.log('\n📧 Top email domains:')
    const sortedDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    for (const [domain, count] of sortedDomains) {
      const isValid = isValidEmail(`test@${domain}`)
      console.log(`  ${domain}: ${count} users ${isValid ? '✅' : '❌'}`)
    }

    // Show sample invalid emails
    console.log('\n❌ Sample invalid emails:')
    invalidUsers.slice(0, 10).forEach(user => {
      console.log(`  ${user.user_email} (${user.user_login})`)
    })

    // Check how many ads these filtered users authored
    const [adsByFilteredUsers] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM wp_posts 
      WHERE post_type = 'ad_listing' 
        AND post_status = 'publish'
        AND post_author IN (
          SELECT ID FROM wp_users 
          WHERE user_email NOT IN (${validUsers.map(u => `'${u.user_email}'`).join(',')})
        )
    `) as [any[], any]

    console.log(`\n🚨 Ads authored by filtered users: ${adsByFilteredUsers[0].count}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

analyzeFilteredUsers().catch(console.error)
