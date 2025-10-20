import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, ArrowLeft, Eye, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ViewTracker } from "@/components/view-tracker"
import { formatDate, getFallbackImage, stripHtml } from "@/lib/wordpress-helpers"
import { notFound } from "next/navigation"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  totalViews?: number
  todayViews?: number
  featuredImageUrl?: string
  imageUrls?: string[]
  author?: {
    id: string
    username: string
    displayName?: string
  }
}

async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetBlogPost($id: ID!) {
            blogPost(id: $id) {
              id
              title
              slug
              content
              excerpt
              status
              createdAt
              updatedAt
              publishedAt
              totalViews
              todayViews
              featuredImageUrl
              imageUrls
              author {
                id
                username
                displayName
              }
            }
          }
        `,
        variables: { id }
      })
    })

    const { data, errors } = await response.json()
    
    if (errors) {
      console.error('GraphQL errors:', errors)
      return null
    }
    
    return data.blogPost
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

async function getRelatedPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetBlogPosts {
            blogPosts(limit: 4, status: "published") {
              id
              title
              slug
              createdAt
              featuredImageUrl
              excerpt
            }
          }
        `
      })
    })

    const { data, errors } = await response.json()
    
    if (errors) {
      console.error('GraphQL errors:', errors)
      return []
    }
    
    return data.blogPosts
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const blogPost = await getBlogPost(id)

  if (!blogPost) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts()
  const imageUrl = blogPost.featuredImageUrl || getFallbackImage()
  const viewCount = (blogPost.totalViews || 0) + (blogPost.todayViews || 0)

  return (
    <div className="min-h-screen">
      <ViewTracker type="blog" id={id} />
      <Header />

      {/* Back Button */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar Homepage
            </Button>
          </Link>
        </div>
      </div>

      {/* Blog Post Header */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Title */}
            <h1 className="mb-6 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {blogPost.title}
            </h1>

            {/* Meta Info */}
            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <span className="font-medium text-foreground">{blogPost.author?.displayName || blogPost.author?.username || 'Auteur'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blogPost.publishedAt || blogPost.createdAt)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={blogPost.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <div
                dangerouslySetInnerHTML={{ __html: blogPost.content || blogPost.excerpt || '' }}
                style={{
                  fontSize: "1.0625rem",
                  lineHeight: "1.75",
                }}
              />
            </div>

            {/* Blog Statistics */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-gray-600" />
                Artikel Statistieken
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-muted-foreground">Vandaag bekeken:</span> 
                  <span className="font-semibold">{blogPost.todayViews || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-muted-foreground">Totaal bekeken:</span> 
                  <span className="font-semibold">{blogPost.totalViews || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-muted-foreground">Gepubliceerd op:</span> 
                  <span className="font-semibold">{formatDate(blogPost.publishedAt || blogPost.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-8 font-serif text-2xl font-bold md:text-3xl">Gerelateerde Artikelen</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedPosts.filter(post => post.id !== id).slice(0, 3).map((relatedPost) => {
                  const relatedImageUrl = relatedPost.featuredImageUrl || getFallbackImage()
                  const excerpt = stripHtml(relatedPost.excerpt || '')

                  return (
                    <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
                      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
                        <div className="relative aspect-[3/2] overflow-hidden">
                          <Image
                            src={relatedImageUrl}
                            alt={relatedPost.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardContent className="p-4 flex flex-col flex-grow">
                          <h3 className="font-serif text-base font-semibold leading-tight transition-colors group-hover:text-primary mb-2">
                            {relatedPost.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex-grow">
                            {excerpt.length > 100 ? excerpt.substring(0, 100) + '...' : excerpt}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>{formatDate(relatedPost.createdAt)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
