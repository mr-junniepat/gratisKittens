import fs from 'fs'
import readline from 'readline'

interface WordPressStats {
  totalUsers: number
  totalPosts: number
  adListings: number
  blogPosts: number
  otherPosts: number
  estimatedSize: string
}

async function analyzeWordPressSQL(): Promise<WordPressStats> {
  const fileStream = fs.createReadStream('gratiskittens_com.sql')
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  const stats: WordPressStats = {
    totalUsers: 0,
    totalPosts: 0,
    adListings: 0,
    blogPosts: 0,
    otherPosts: 0,
    estimatedSize: '0MB'
  }

  for await (const line of rl) {
    if (line.includes("INSERT INTO `wp_users`")) {
      stats.totalUsers++
    }
    if (line.includes("INSERT INTO `wp_posts`")) {
      stats.totalPosts++
      // Parse post_type from the INSERT statement
      if (line.includes("'ad_listing'")) stats.adListings++
      else if (line.includes("'post'")) stats.blogPosts++
      else stats.otherPosts++
    }
  }

  const fileStats = fs.statSync('gratiskittens_com.sql')
  stats.estimatedSize = `${(fileStats.size / (1024 * 1024)).toFixed(2)}MB`

  console.log('WordPress Data Analysis:', stats)
  return stats
}

analyzeWordPressSQL()
