import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import https from 'https'
import http from 'http'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ImageInfo {
  originalUrl: string
  fileName: string
  bucket: 'ad-images' | 'blog-images'
  recordId: string
  type: string
  title: string
}

class ImageDownloader {
  private migratedImages = new Map<string, string>() // original URL -> new URL

  async createSupabaseBuckets(): Promise<void> {
    console.log('📦 Creating Supabase Storage buckets...')
    
    // Create buckets if they don't exist
    const { error: adError } = await supabase.storage.createBucket('ad-images', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    })

    const { error: blogError } = await supabase.storage.createBucket('blog-images', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    })

    if (adError && !adError.message.includes('already exists')) {
      console.error('Error creating ad-images bucket:', adError)
    }

    if (blogError && !blogError.message.includes('already exists')) {
      console.error('Error creating blog-images bucket:', blogError)
    }

    console.log('✅ Storage buckets ready')
  }

  private generateFileName(originalUrl: string, recordId: string, type: string): string {
    const ext = path.extname(originalUrl) || '.jpg'
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(4).toString('hex')
    
    return `${recordId}-${type}-${timestamp}-${randomId}${ext}`
  }

  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }
    return types[ext] || 'image/jpeg'
  }

  async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http
      
      client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`))
          return
        }

        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      }).on('error', reject)
    })
  }

  async uploadToSupabase(imageBuffer: Buffer, bucket: string, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, imageBuffer, {
        contentType: this.getContentType(fileName),
        upsert: true
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return publicUrl
  }

  async getAllImagesToMigrate(): Promise<ImageInfo[]> {
    console.log('🔍 Getting images related to ad listings and blog posts...')
    
    const images: ImageInfo[] = []
    const processedUrls = new Set<string>()

    // Get ad listing images
    const { data: ads, error: adError } = await supabase
      .from('ad_listings')
      .select('id, title, featured_image_url, image_urls')
      .not('featured_image_url', 'is', null)

    if (adError) {
      console.error('Error fetching ad listings:', adError)
    } else {
      console.log(`📋 Processing ${ads?.length || 0} ad listings...`)
      
      for (const ad of ads || []) {
        // Featured image
        if (ad.featured_image_url && !processedUrls.has(ad.featured_image_url)) {
          if (ad.featured_image_url.includes('wp-content/uploads/') && ad.featured_image_url.includes('gratiskittens.com')) {
            images.push({
              originalUrl: ad.featured_image_url,
              fileName: this.generateFileName(ad.featured_image_url, ad.id, 'featured'),
              bucket: 'ad-images',
              recordId: ad.id,
              type: 'featured',
              title: ad.title
            })
            processedUrls.add(ad.featured_image_url)
          }
        }

        // Gallery images
        if (ad.image_urls && Array.isArray(ad.image_urls)) {
          for (let i = 0; i < ad.image_urls.length; i++) {
            const imageUrl = ad.image_urls[i]
            if (imageUrl && !processedUrls.has(imageUrl)) {
              if (imageUrl.includes('wp-content/uploads/') && imageUrl.includes('gratiskittens.com')) {
                images.push({
                  originalUrl: imageUrl,
                  fileName: this.generateFileName(imageUrl, ad.id, `gallery-${i}`),
                  bucket: 'ad-images',
                  recordId: ad.id,
                  type: `gallery-${i}`,
                  title: ad.title
                })
                processedUrls.add(imageUrl)
              }
            }
          }
        }
      }
    }

    // Get blog post images
    const { data: posts, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, featured_image_url, content')

    if (postError) {
      console.error('Error fetching blog posts:', postError)
    } else {
      console.log(`📝 Processing ${posts?.length || 0} blog posts...`)
      
      for (const post of posts || []) {
        // Featured image
        if (post.featured_image_url && !processedUrls.has(post.featured_image_url)) {
          if (post.featured_image_url.includes('wp-content/uploads/') && post.featured_image_url.includes('gratiskittens.com')) {
            images.push({
              originalUrl: post.featured_image_url,
              fileName: this.generateFileName(post.featured_image_url, post.id, 'featured'),
              bucket: 'blog-images',
              recordId: post.id,
              type: 'featured',
              title: post.title
            })
            processedUrls.add(post.featured_image_url)
          }
        }

        // Content images
        if (post.content) {
          const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
          const contentImages = []
          let match
          
          while ((match = imageRegex.exec(post.content)) !== null) {
            contentImages.push(match[1])
          }

          for (let i = 0; i < contentImages.length; i++) {
            const imageUrl = contentImages[i]
            if (imageUrl && !processedUrls.has(imageUrl) && imageUrl.includes('wp-content/uploads/') && imageUrl.includes('gratiskittens.com')) {
              images.push({
                originalUrl: imageUrl,
                fileName: this.generateFileName(imageUrl, post.id, `content-${i}`),
                bucket: 'blog-images',
                recordId: post.id,
                type: `content-${i}`,
                title: post.title
              })
              processedUrls.add(imageUrl)
            }
          }
        }
      }
    }

    console.log(`📊 Found ${images.length} unique images to migrate`)
    console.log(`  - Ad listing images: ${images.filter(img => img.bucket === 'ad-images').length}`)
    console.log(`  - Blog post images: ${images.filter(img => img.bucket === 'blog-images').length}`)
    
    return images
  }

  async migrateImage(imageInfo: ImageInfo): Promise<void> {
    try {
      console.log(`⬇️ Downloading: ${imageInfo.originalUrl}`)
      const imageBuffer = await this.downloadImage(imageInfo.originalUrl)

      console.log(`⬆️ Uploading to Supabase: ${imageInfo.fileName}`)
      const newUrl = await this.uploadToSupabase(imageBuffer, imageInfo.bucket, imageInfo.fileName)

      // Store mapping
      this.migratedImages.set(imageInfo.originalUrl, newUrl)

      console.log(`✅ Migrated: ${imageInfo.title} -> ${newUrl}`)
    } catch (error) {
      console.error(`❌ Failed to migrate image ${imageInfo.originalUrl}:`, error)
    }
  }

  async updateDatabaseUrls(): Promise<void> {
    console.log('🔄 Updating database with new image URLs...')

    // Update ad listings
    const { data: ads } = await supabase
      .from('ad_listings')
      .select('id, featuredImageUrl, imageUrls')

    for (const ad of ads || []) {
      let updated = false
      const updates: any = {}

      // Update featured image
      if (ad.featuredImageUrl && this.migratedImages.has(ad.featuredImageUrl)) {
        updates.featuredImageUrl = this.migratedImages.get(ad.featuredImageUrl)
        updated = true
      }

      // Update image array
      if (ad.imageUrls && Array.isArray(ad.imageUrls)) {
        const newImageUrls = ad.imageUrls.map(url => 
          this.migratedImages.get(url) || url
        )
        updates.imageUrls = newImageUrls
        updated = true
      }

      if (updated) {
        await supabase
          .from('ad_listings')
          .update(updates)
          .eq('id', ad.id)
      }
    }

    // Update blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, featuredImageUrl, content')

    for (const post of posts || []) {
      let updated = false
      const updates: any = {}

      // Update featured image
      if (post.featuredImageUrl && this.migratedImages.has(post.featuredImageUrl)) {
        updates.featuredImageUrl = this.migratedImages.get(post.featuredImageUrl)
        updated = true
      }

      // Update content images
      if (post.content) {
        let newContent = post.content
        for (const [oldUrl, newUrl] of this.migratedImages) {
          newContent = newContent.replace(new RegExp(oldUrl, 'g'), newUrl)
        }
        if (newContent !== post.content) {
          updates.content = newContent
          updated = true
        }
      }

      if (updated) {
        await supabase
          .from('blog_posts')
          .update(updates)
          .eq('id', post.id)
      }
    }

    console.log('✅ Database URLs updated')
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting image download and upload via HTTP...')
      console.log('📋 Only migrating images related to ad listings and blog posts')
      
      // Setup
      await this.createSupabaseBuckets()

      // Get all images to migrate
      const images = await this.getAllImagesToMigrate()

      if (images.length === 0) {
        console.log('ℹ️ No images found to migrate')
        return
      }

      // Migrate images one by one
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        console.log(`\n📸 Migrating image ${i + 1}/${images.length}: ${image.fileName}`)
        console.log(`   From: ${image.originalUrl}`)
        console.log(`   Title: ${image.title}`)
        await this.migrateImage(image)
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Update database
      await this.updateDatabaseUrls()

      console.log('🎉 Image migration completed!')
      console.log(`📊 Migrated ${this.migratedImages.size} images`)
      console.log('🔗 All image URLs updated in database')

    } catch (error) {
      console.error('❌ Migration failed:', error)
    }
  }
}

// Run the migration
async function main() {
  const downloader = new ImageDownloader()
  await downloader.run()
}

main().catch(console.error)
