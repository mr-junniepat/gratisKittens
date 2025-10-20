import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { stripHtml, formatDate, getFallbackImage } from "@/lib/wordpress-helpers"

interface BlogPost {
  id: string
  title: string
  content?: string
  excerpt?: string
  featuredImageUrl?: string
  imageUrls?: string[]
  author?: {
    username: string
    displayName?: string
  }
  createdAt: string
  publishedAt?: string
  totalViews?: number
}

async function getLatestPosts(): Promise<BlogPost[]> {
  try {
    console.log('📝 Fetching latest blog posts from Supabase...')
    
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            blogPosts(limit: 50, status: "published") {
              id
              title
              content
              excerpt
              featuredImageUrl
              imageUrls
              author {
                username
                displayName
              }
              createdAt
              publishedAt
              totalViews
            }
          }
        `
      })
    })

    const data = await response.json()
    
    if (data.errors) {
      throw new Error(data.errors[0].message)
    }

    const allPosts = data.data.blogPosts || []
    console.log('📊 Blog posts fetched:', allPosts.length)
    
    // Sort by createdAt (latest first) and take first 3
    const latestPosts = allPosts
      .sort((a: BlogPost, b: BlogPost) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA // Latest first
      })
      .slice(0, 3)
    
    console.log('📊 Latest posts selected:', latestPosts.length)
    
    return latestPosts
  } catch (error) {
    console.error('❌ Error fetching blog posts:', error)
    return []
  }
}

export async function BlogPreview() {
  const posts = await getLatestPosts()

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="mb-3 font-serif text-3xl font-bold tracking-tight md:text-4xl">Laatste Verhalen & Tips</h2>
            <p className="text-lg text-muted-foreground">Ontdek handige tips en inspirerende verhalen over katten</p>
          </div>
          <Link href="/blog">
            <Button variant="outline" className="hidden md:inline-flex bg-transparent">
              Alle Artikelen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const imageUrl = post.featuredImageUrl || getFallbackImage()
            const fullExcerpt = stripHtml(post.excerpt || post.content || '')
            const excerpt = fullExcerpt.length > 300 ? fullExcerpt.substring(0, 300) + '...' : fullExcerpt
            const formattedDate = formatDate(post.publishedAt || post.createdAt || new Date().toISOString())
            const viewCount = post.totalViews || 0
            
            return (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <Eye className="h-4 w-4" />
                      <span>{viewCount.toLocaleString()} views</span>
                    </div>
                    <h3 className="mb-2 font-serif text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground flex-grow">{excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/blog">
            <Button variant="outline">
              Alle Artikelen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
