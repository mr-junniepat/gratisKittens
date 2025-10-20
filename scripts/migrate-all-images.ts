import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import https from 'https'
import http from 'http'
import { URL } from 'url'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to download image
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }
      
      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

// Helper function to get file extension from URL
function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot === -1) return 'jpg' // default
    return pathname.substring(lastDot + 1).toLowerCase()
  } catch {
    return 'jpg'
  }
}

// Helper function to get MIME type
function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  }
  return mimeTypes[extension] || 'image/jpeg'
}

// Helper function to extract image URLs from content
function extractImageUrls(content: string): string[] {
  if (!content) return []
  
  const imageUrls: string[] = []
  
  // Match img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    imageUrls.push(match[1])
  }
  
  // Match WordPress attachment URLs
  const wpRegex = /https?:\/\/[^\/]+\/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi
  while ((match = wpRegex.exec(content)) !== null) {
    imageUrls.push(match[0])
  }
  
  return [...new Set(imageUrls)] // Remove duplicates
}

async function migrateAllImages() {
  console.log('Starting comprehensive image migration...')
  
  try {
    // Read the JSON file
    console.log('Reading ad_listings_only.json...')
    const jsonData = JSON.parse(fs.readFileSync('ad_listings_only.json', 'utf8'))
    
    // Find the table data section
    const tableData = jsonData.find(item => item.type === 'table' && item.name === 'wp_posts')
    
    if (!tableData) {
      throw new Error('Could not find wp_posts table data in JSON')
    }
    
    const adListings = tableData.data
    console.log(`Processing ${adListings.length} ad listings for images...`)
    
    // Create storage bucket if it doesn't exist
    console.log('Ensuring storage bucket exists...')
    try {
      await supabase.storage.createBucket('ad-images', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      })
      console.log('✅ Storage bucket created')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Storage bucket already exists')
      } else {
        console.log('Storage bucket error:', error.message)
      }
    }
    
    let totalImagesProcessed = 0
    let totalImagesUploaded = 0
    let totalErrors = 0
    const processedUrls = new Set<string>() // Track processed URLs to avoid duplicates
    
    for (let i = 0; i < adListings.length; i++) {
      const post = adListings[i]
      const postId = post.ID
      
      try {
        console.log(`\nProcessing post ${postId} (${i + 1}/${adListings.length}): ${post.post_title}`)
        
        // Extract image URLs from content
        const imageUrls = extractImageUrls(post.post_content || '')
        
        if (imageUrls.length === 0) {
          console.log(`  No images found in post ${postId}`)
          continue
        }
        
        console.log(`  Found ${imageUrls.length} images in post ${postId}`)
        
        const uploadedUrls: string[] = []
        
        for (const imageUrl of imageUrls) {
          // Skip if we've already processed this URL
          if (processedUrls.has(imageUrl)) {
            console.log(`    Skipping duplicate URL: ${imageUrl}`)
            continue
          }
          
          try {
            console.log(`    Downloading: ${imageUrl}`)
            
            // Download image
            const imageBuffer = await downloadImage(imageUrl)
            totalImagesProcessed++
            
            // Get file info
            const extension = getFileExtension(imageUrl)
            const mimeType = getMimeType(extension)
            const fileName = `ad-${postId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`
            
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
              .from('ad-images')
              .upload(fileName, imageBuffer, {
                contentType: mimeType,
                cacheControl: '3600'
              })
            
            if (error) {
              console.error(`    Error uploading ${imageUrl}:`, error.message)
              totalErrors++
              continue
            }
            
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('ad-images')
              .getPublicUrl(fileName)
            
            const publicUrl = publicUrlData.publicUrl
            uploadedUrls.push(publicUrl)
            processedUrls.add(imageUrl)
            totalImagesUploaded++
            
            console.log(`    ✅ Uploaded: ${fileName}`)
            
          } catch (error) {
            console.error(`    Error processing ${imageUrl}:`, error)
            totalErrors++
          }
        }
        
        // Update the ad_listing in Supabase with the new image URLs
        if (uploadedUrls.length > 0) {
          try {
            const { error: updateError } = await supabase
              .from('ad_listings')
              .update({
                featured_image_url: uploadedUrls[0], // First image as featured
                image_urls: uploadedUrls
              })
              .eq('wordpress_post_id', postId)
            
            if (updateError) {
              console.error(`    Error updating ad_listing ${postId}:`, updateError.message)
            } else {
              console.log(`    ✅ Updated ad_listing ${postId} with ${uploadedUrls.length} images`)
            }
          } catch (error) {
            console.error(`    Error updating ad_listing ${postId}:`, error)
          }
        }
        
        // Progress update every 50 posts
        if ((i + 1) % 50 === 0) {
          console.log(`\n📊 Progress: ${i + 1}/${adListings.length} posts processed`)
          console.log(`📊 Images: ${totalImagesProcessed} downloaded, ${totalImagesUploaded} uploaded, ${totalErrors} errors`)
        }
        
      } catch (error) {
        console.error(`Error processing post ${postId}:`, error)
        totalErrors++
      }
    }
    
    console.log(`\n🎉 Image migration completed!`)
    console.log(`📊 Total images processed: ${totalImagesProcessed}`)
    console.log(`📊 Total images uploaded: ${totalImagesUploaded}`)
    console.log(`📊 Total errors: ${totalErrors}`)
    console.log(`📊 Unique URLs processed: ${processedUrls.size}`)
    
    // Test the GraphQL API to see if images are working
    console.log('\nTesting GraphQL API with images...')
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ adListings(limit: 3) { id title featuredImageUrl imageUrls } }'
      })
    })
    
    const result = await response.json()
    if (result.data?.adListings) {
      console.log('✅ GraphQL API is working with images!')
      result.data.adListings.forEach((ad: any, index: number) => {
        console.log(`${index + 1}. ${ad.title}`)
        console.log(`   Featured: ${ad.featuredImageUrl || 'None'}`)
        console.log(`   Images: ${ad.imageUrls?.length || 0} total`)
      })
    } else {
      console.log('❌ GraphQL API error:', result.errors)
    }
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

migrateAllImages().catch(console.error)
