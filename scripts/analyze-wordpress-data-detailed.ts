import fs from 'fs'
import readline from 'readline'

interface DetailedStats {
  totalUsers: number
  totalPosts: number
  adListings: number
  blogPosts: number
  otherPosts: number
  postMetaEntries: number
  userMetaEntries: number
  estimatedSize: string
  sampleAdListings: string[]
  sampleBlogPosts: string[]
}

async function analyzeWordPressSQLDetailed(): Promise<DetailedStats> {
  const fileStream = fs.createReadStream('gratiskittens_com.sql')
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  const stats: DetailedStats = {
    totalUsers: 0,
    totalPosts: 0,
    adListings: 0,
    blogPosts: 0,
    otherPosts: 0,
    postMetaEntries: 0,
    userMetaEntries: 0,
    estimatedSize: '0MB',
    sampleAdListings: [],
    sampleBlogPosts: []
  }

  let currentTable = ''
  let inInsertStatement = false
  let insertBuffer = ''

  for await (const line of rl) {
    // Track which table we're inserting into
    if (line.includes('INSERT INTO `')) {
      currentTable = line.match(/INSERT INTO `([^`]+)`/)?.[1] || ''
      inInsertStatement = true
      insertBuffer = line
    } else if (inInsertStatement) {
      insertBuffer += line
      
      // Check if this is the end of the INSERT statement
      if (line.includes(';')) {
        inInsertStatement = false
        
        // Count entries based on VALUES clauses
        const valuesMatches = insertBuffer.match(/VALUES\s*\(/g)
        const entryCount = valuesMatches ? valuesMatches.length : 0
        
        if (currentTable === 'wp_users') {
          stats.totalUsers += entryCount
        } else if (currentTable === 'wp_posts') {
          stats.totalPosts += entryCount
          
          // Extract post types from the INSERT statement
          const postTypeMatches = insertBuffer.match(/'ad_listing'/g)
          const blogMatches = insertBuffer.match(/'post'/g)
          
          if (postTypeMatches) {
            stats.adListings += postTypeMatches.length
            // Extract sample titles
            const titleMatches = insertBuffer.match(/'([^']*ad[^']*|kitten[^']*|kat[^']*)'/gi)
            if (titleMatches && stats.sampleAdListings.length < 5) {
              stats.sampleAdListings.push(...titleMatches.slice(0, 5 - stats.sampleAdListings.length))
            }
          }
          if (blogMatches) {
            stats.blogPosts += blogMatches.length
            // Extract sample titles
            const titleMatches = insertBuffer.match(/'([^']*blog[^']*|artikel[^']*|nieuws[^']*)'/gi)
            if (titleMatches && stats.sampleBlogPosts.length < 5) {
              stats.sampleBlogPosts.push(...titleMatches.slice(0, 5 - stats.sampleBlogPosts.length))
            }
          }
          
          // Count other post types
          const otherMatches = insertBuffer.match(/'[^']*'/g) || []
          const otherCount = otherMatches.length - (postTypeMatches?.length || 0) - (blogMatches?.length || 0)
          stats.otherPosts += Math.max(0, otherCount)
          
        } else if (currentTable === 'wp_postmeta') {
          stats.postMetaEntries += entryCount
        } else if (currentTable === 'wp_usermeta') {
          stats.userMetaEntries += entryCount
        }
        
        insertBuffer = ''
        currentTable = ''
      }
    }
  }

  const fileStats = fs.statSync('gratiskittens_com.sql')
  stats.estimatedSize = `${(fileStats.size / (1024 * 1024)).toFixed(2)}MB`

  console.log('Detailed WordPress Data Analysis:', stats)
  return stats
}

analyzeWordPressSQLDetailed()
