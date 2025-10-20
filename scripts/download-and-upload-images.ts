import { createClient } from '@supabase/supabase-js'
import { Client } from 'ssh2'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SFTP credentials - Using SSH key authentication
const sftpConfig = {
  host: '188.166.85.14',
  username: 'gratiskittens_com',
  // No password needed - will use SSH key authentication
}

interface ImageInfo {
  originalUrl: string
  sftpPath: string
  fileName: string
  bucket: 'ad-images' | 'blog-images'
  recordId: string
  type: string
}

class ImageDownloader {
  private sftp: Client
  private migratedImages = new Map<string, string>() // original URL -> new URL

  constructor() {
    this.sftp = new Client()
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.connect({
        host: sftpConfig.host,
        username: sftpConfig.username,
        readyTimeout: 20000,
        // Use SSH key authentication (no password)
        // Will automatically use ~/.ssh/id_rsa or other configured keys
      })

      this.sftp.on('ready', () => {
        console.log('✅ Connected to SFTP server via SSH')
        resolve()
      })

      this.sftp.on('error', (err) => {
        console.error('❌ SFTP connection error:', err)
        reject(err)
      })
    })
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.sftp.end()
      console.log('✅ Disconnected from SFTP server')
      resolve()
    })
  }

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

  private convertUrlToSFTPPath(url: string): string | null {
    // Convert WordPress URL to SFTP path
    // Example: https://gratiskittens.com/wp-content/uploads/2017/12/image.jpg
    // -> /wp-content/uploads/2017/12/image.jpg
    
    try {
      const urlObj = new URL(url)
      if (!urlObj.hostname.includes('gratiskittens')) {
        return null
      }
      
      const pathname = urlObj.pathname
      if (pathname.startsWith('/wp-content/uploads/')) {
        return pathname
      }
      
      return null
    } catch {
      return null
    }
  }

  private generateFileName(originalUrl: string, recordId: string, type: string): string {
    const ext = path.extname(originalUrl) || '.jpg'
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(4).toString('hex')
    
    return `${recordId}-${type}-${timestamp}-${randomId}${ext}`
  }

  async downloadFromSFTP(remotePath: string, localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.sftp((err, sftp) => {
        if (err) {
          reject(err)
          return
        }

        // Create local directory if it doesn't exist
        const dir = path.dirname(localPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        sftp.fastGet(remotePath, localPath, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  }

  async uploadToSupabase(localPath: string, bucket: string, fileName: string): Promise<string> {
    const fileBuffer = fs.readFileSync(localPath)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
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

  async getAllImagesToMigrate(): Promise<ImageInfo[]> {
    console.log('🔍 Getting images related to ad listings, profiles, and blog posts...')
    
    const images: ImageInfo[] = []
    const processedUrls = new Set<string>() // Avoid duplicates

    // Get ad listing images (featured and gallery)
    const { data: ads, error: adError } = await supabase
      .from('ad_listings')
      .select('id, featured_image_url, image_urls')
      .not('featured_image_url', 'is', null)

    if (adError) {
      console.error('Error fetching ad listings:', adError)
    } else {
      console.log(`📋 Processing ${ads?.length || 0} ad listings...`)
      
      for (const ad of ads || []) {
        // Featured image
        if (ad.featured_image_url && !processedUrls.has(ad.featured_image_url)) {
          const sftpPath = this.convertUrlToSFTPPath(ad.featured_image_url)
          if (sftpPath) {
            images.push({
              originalUrl: ad.featured_image_url,
              sftpPath,
              fileName: this.generateFileName(ad.featured_image_url, ad.id, 'featured'),
              bucket: 'ad-images',
              recordId: ad.id,
              type: 'featured'
            })
            processedUrls.add(ad.featured_image_url)
          }
        }

        // Gallery images
        if (ad.image_urls && Array.isArray(ad.image_urls)) {
          for (let i = 0; i < ad.image_urls.length; i++) {
            const imageUrl = ad.image_urls[i]
            if (imageUrl && !processedUrls.has(imageUrl)) {
              const sftpPath = this.convertUrlToSFTPPath(imageUrl)
              if (sftpPath) {
                images.push({
                  originalUrl: imageUrl,
                  sftpPath,
                  fileName: this.generateFileName(imageUrl, ad.id, `gallery-${i}`),
                  bucket: 'ad-images',
                  recordId: ad.id,
                  type: `gallery-${i}`
                })
                processedUrls.add(imageUrl)
              }
            }
          }
        }
      }
    }

    // Get blog post images (featured and content)
    const { data: posts, error: postError } = await supabase
      .from('blog_posts')
      .select('id, featured_image_url, content')

    if (postError) {
      console.error('Error fetching blog posts:', postError)
    } else {
      console.log(`📝 Processing ${posts?.length || 0} blog posts...`)
      
      for (const post of posts || []) {
        // Featured image
        if (post.featured_image_url && !processedUrls.has(post.featured_image_url)) {
          const sftpPath = this.convertUrlToSFTPPath(post.featured_image_url)
          if (sftpPath) {
            images.push({
              originalUrl: post.featured_image_url,
              sftpPath,
              fileName: this.generateFileName(post.featured_image_url, post.id, 'featured'),
              bucket: 'blog-images',
              recordId: post.id,
              type: 'featured'
            })
            processedUrls.add(post.featured_image_url)
          }
        }

        // Content images (only WordPress uploads)
        if (post.content) {
          const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
          const contentImages = []
          let match
          
          while ((match = imageRegex.exec(post.content)) !== null) {
            contentImages.push(match[1])
          }

          for (let i = 0; i < contentImages.length; i++) {
            const imageUrl = contentImages[i]
            if (imageUrl && !processedUrls.has(imageUrl) && this.isWordPressImage(imageUrl)) {
              const sftpPath = this.convertUrlToSFTPPath(imageUrl)
              if (sftpPath) {
                images.push({
                  originalUrl: imageUrl,
                  sftpPath,
                  fileName: this.generateFileName(imageUrl, post.id, `content-${i}`),
                  bucket: 'blog-images',
                  recordId: post.id,
                  type: `content-${i}`
                })
                processedUrls.add(imageUrl)
              }
            }
          }
        }
      }
    }

    console.log(`📊 Found ${images.length} unique images to migrate (${processedUrls.size} unique URLs)`)
    console.log(`  - Ad listing images: ${images.filter(img => img.bucket === 'ad-images').length}`)
    console.log(`  - Blog post images: ${images.filter(img => img.bucket === 'blog-images').length}`)
    
    return images
  }

  private isWordPressImage(url: string): boolean {
    // Only include images from WordPress uploads directory
    return url.includes('wp-content/uploads/') && url.includes('gratiskittens.com')
  }

  async migrateImage(imageInfo: ImageInfo): Promise<void> {
    try {
      const localPath = path.join('temp-images', imageInfo.fileName)

      // Download from SFTP
      console.log(`⬇️ Downloading: ${imageInfo.sftpPath}`)
      await this.downloadFromSFTP(imageInfo.sftpPath, localPath)

      // Upload to Supabase
      console.log(`⬆️ Uploading to Supabase: ${imageInfo.fileName}`)
      const newUrl = await this.uploadToSupabase(localPath, imageInfo.bucket, imageInfo.fileName)

      // Store mapping
      this.migratedImages.set(imageInfo.originalUrl, newUrl)

      // Clean up local file
      fs.unlinkSync(localPath)

      console.log(`✅ Migrated: ${imageInfo.originalUrl} -> ${newUrl}`)
    } catch (error) {
      console.error(`❌ Failed to migrate image ${imageInfo.originalUrl}:`, error)
    }
  }

  async updateDatabaseUrls(): Promise<void> {
    console.log('🔄 Updating database with new image URLs...')

    // Update ad listings
    const { data: ads } = await supabase
      .from('ad_listings')
      .select('id, featured_image_url, image_urls')

    for (const ad of ads || []) {
      let updated = false
      const updates: any = {}

      // Update featured image
      if (ad.featured_image_url && this.migratedImages.has(ad.featured_image_url)) {
        updates.featured_image_url = this.migratedImages.get(ad.featured_image_url)
        updated = true
      }

      // Update image array
      if (ad.image_urls && Array.isArray(ad.image_urls)) {
        const newImageUrls = ad.image_urls.map(url => 
          this.migratedImages.get(url) || url
        )
        updates.image_urls = newImageUrls
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
      .select('id, featured_image_url, content')

    for (const post of posts || []) {
      let updated = false
      const updates: any = {}

      // Update featured image
      if (post.featured_image_url && this.migratedImages.has(post.featured_image_url)) {
        updates.featured_image_url = this.migratedImages.get(post.featured_image_url)
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
      console.log('🚀 Starting image download and upload via SSH...')
      console.log('📋 Only migrating images related to ad listings, profiles, and blog posts')
      
      // Create temp directory
      if (!fs.existsSync('temp-images')) {
        fs.mkdirSync('temp-images')
      }

      // Setup
      await this.createSupabaseBuckets()
      await this.connect()

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
        await this.migrateImage(image)
      }

      // Update database
      await this.updateDatabaseUrls()

      console.log('🎉 Image migration completed!')
      console.log(`📊 Migrated ${this.migratedImages.size} images`)
      console.log('🔗 All image URLs updated in database')

    } catch (error) {
      console.error('❌ Migration failed:', error)
    } finally {
      await this.disconnect()
      
      // Clean up temp directory
      if (fs.existsSync('temp-images')) {
        fs.rmSync('temp-images', { recursive: true, force: true })
      }
    }
  }
}

// Run the migration
async function main() {
  const downloader = new ImageDownloader()
  await downloader.run()
}

main().catch(console.error)
