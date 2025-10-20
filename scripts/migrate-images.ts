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

// SFTP credentials
const sftpConfig = {
  host: '188.166.85.14',
  username: 'gratiskittens_com',
  password: 'YOUR_SFTP_PASSWORD' // You'll need to provide this
}

interface ImageMigration {
  originalUrl: string
  newUrl: string
  localPath: string
  bucket: 'ad-images' | 'blog-images'
}

class ImageMigrator {
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
        password: sftpConfig.password,
        readyTimeout: 20000
      })

      this.sftp.on('ready', () => {
        console.log('✅ Connected to SFTP server')
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

  private generateFileName(originalUrl: string, bucket: string): string {
    // Extract original filename and add timestamp for uniqueness
    const originalName = path.basename(originalUrl)
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(4).toString('hex')
    const ext = path.extname(originalName)
    
    return `${campaign}-${timestamp}-${randomId}${ext}`
  }

  async migrateAdImages(): Promise<void> {
    console.log('🖼️ Migrating ad listing images...')
    
    // Get all ad listings with images
    const { data: ads, error } = await supabase
      .from('ad_listings')
      .select('id, featured_image_url, image_urls, title')
      .not('featured_image_url', 'is', null)

    if (error) {
      console.error('Error fetching ad listings:', error)
      return
    }

    console.log(`Found ${ads?.length || 0} ad listings with images`)

    for (const ad of ads || []) {
      try {
        // Process featured image
        if (ad.featured_image_url && ad.featured_image_url.startsWith('http')) {
          await this.migrateSingleImage(ad.featured_image_url, 'ad-images', ad.id, 'featured')
        }

        // Process additional images
        if (ad.image_urls && Array.isArray(ad.image_urls)) {
          for (let i = 0; i < ad.image_urls.length; i++) {
            const imageUrl = ad.image_urls[i]
            if (imageUrl && imageUrl.startsWith('http')) {
              await this.migrateSingleImage(imageUrl, 'ad-images', ad.id, `gallery-${i}`)
            }
          }
        }

        console.log(`✅ Migrated images for ad: ${ad.title}`)
      } catch (error) {
        console.error(`❌ Failed to migrate images for ad ${ad.id}:`, error)
      }
    }
  }

  async migrateBlogImages(): Promise<void> {
    console.log('📝 Migrating blog post images...')
    
    // Get all blog posts with images
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, featured_image_url, content, title')
      .not('featured_image_url', 'is', null)

    if (error) {
      console.error('Error fetching blog posts:', error)
      return
    }

    console.log(`Found ${posts?.length || 0} blog posts with images`)

    for (const post of posts || []) {
      try {
        // Process featured image
        if (post.featured_image_url && post.featured_image_url.startsWith('http')) {
          await this.migrateSingleImage(post.featured_image_url, 'blog-images', post.id, 'featured')
        }

        // Extract images from content (basic regex)
        const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
        const contentImages = []
        let match
        
        while ((match = imageRegex.exec(post.content || '')) !== null) {
          contentImages.push(match[1])
        }

        for (let i = 0; i < contentImages.length; i++) {
          const imageUrl = contentImages[i]
          if (imageUrl && imageUrl.startsWith('http')) {
            await this.migrateSingleImage(imageUrl, 'blog-images', post.id, `content-${i}`)
          }
        }

        console.log(`✅ Migrated images for blog post: ${post.title}`)
      } catch (error) {
        console.error(`❌ Failed to migrate images for blog post ${post.id}:`, error)
      }
    }
  }

  private async migrateSingleImage(
    originalUrl: string, 
    bucket: string, 
    recordId: string, 
    type: string
  ): Promise<void> {
    try {
      // Skip if already migrated
      if (this.migratedImages.has(originalUrl)) {
        return
      }

      // Parse WordPress URL to get SFTP path
      const sftpPath = this.convertUrlToSFTPPath(originalUrl)
      if (!sftpPath) {
        console.log(`⚠️ Skipping non-WordPress URL: ${originalUrl}`)
        return
      }

      // Generate unique filename
      const fileName = this.generateFileName(originalUrl, bucket, recordId, type)
      const localPath = path.join('temp-images', fileName)

      // Download from SFTP
      console.log(`⬇️ Downloading: ${sftpPath}`)
      await this.downloadFromSFTP(sftpPath, localPath)

      // Upload to Supabase
      console.log(`⬆️ Uploading to Supabase: ${fileName}`)
      const newUrl = await this.uploadToSupabase(localPath, bucket, fileName)

      // Store mapping
      this.migratedImages.set(originalUrl, newUrl)

      // Clean up local file
      fs.unlinkSync(localPath)

      console.log(`✅ Migrated: ${originalUrl} -> ${newUrl}`)
    } catch (error) {
      console.error(`❌ Failed to migrate image ${originalUrl}:`, error)
    }
  }

  private convertUrlToSFTPPath(url: string): string | null {
    // Convert WordPress URL to SFTP path
    // Example: https://gratiskittens.com/wp-content/uploads/2023/05/image.jpg
    // -> /wp-content/uploads/2023/05/image.jpg
    
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

  private generateFileName(originalUrl: string, bucket: string, recordId: string, type: string): string {
    const ext = path.extname(originalUrl) || '.jpg'
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(4).toString('hex')
    
    return `${recordId}-${type}-${timestamp}-${randomId}${ext}`
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
      console.log('🚀 Starting image migration...')
      
      // Create temp directory
      if (!fs.existsSync('temp-images')) {
        fs.mkdirSync('temp-images')
      }

      // Setup
      await this.createSupabaseBuckets()
      await this.connect()

      // Migrate images
      await this.migrateAdImages()
      await this.migrateBlogImages()

      // Update database
      await this.updateDatabaseUrls()

      console.log('🎉 Image migration completed!')
      console.log(`📊 Migrated ${this.migratedImages.size} images`)

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
  const migrator = new ImageMigrator()
  await migrator.run()
}

main().catch(console.error)
