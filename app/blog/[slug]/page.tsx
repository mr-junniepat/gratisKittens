import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AdBanner } from "@/components/ad-banner"
import { ShareButton } from "@/components/share-button"
import { apolloClient } from "@/lib/apollo-client"
import { GET_POST_BY_SLUG, GET_POSTS } from "@/lib/queries"
import { formatDate, calculateReadingTime, getFallbackImage, getViewCount } from "@/lib/wordpress-helpers"
import type { Post } from "@/lib/types"
import { notFound } from "next/navigation"

async function getPost(slug: string) {
  try {
    const { data } = await apolloClient.query({
      query: GET_POST_BY_SLUG,
      variables: { slug },
    })
    return data.postBy
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

async function getRelatedPosts() {
  try {
    const { data } = await apolloClient.query({
      query: GET_POSTS,
      variables: { first: 3 },
    })
    return data.posts.nodes
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts: Post[] = await getRelatedPosts()
  return (
    <div className="min-h-screen">
      <Header />

      {/* Back Button */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Title */}
            <h1 className="mb-6 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10" />
                <span className="font-medium text-foreground">{post.author?.node.name || 'Admin'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.date)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{calculateReadingTime(post.content || '')} lezen</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{getViewCount(post).toLocaleString()} views</span>
              </div>
              <div className="ml-auto">
                <ShareButton title={post.title} />
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-lg">
                <Image 
                  src={post.featuredImage.node.sourceUrl || getFallbackImage()} 
                  alt={post.featuredImage.node.altText || post.title} 
                  fill 
                  className="object-cover" 
                />
              </div>
            )}

            <AdBanner slot="blog-post-top" />

            {/* Article Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
              style={{
                fontSize: "1.0625rem",
                lineHeight: "1.75",
              }}
            />

            <AdBanner slot="blog-post-mid" />

            {/* Author Bio */}
            {post.author && (
              <div className="mt-12 rounded-lg border bg-muted/30 p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 flex-shrink-0 rounded-full bg-primary/10" />
                  <div>
                    <h3 className="mb-2 font-semibold">Over {post.author.node.name}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {post.author.node.name} deelt graag kennis en passie voor katten met anderen.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                {relatedPosts.map((relatedPost) => {
                  const imageUrl = relatedPost.featuredImage?.node.sourceUrl || getFallbackImage()
                  
                  return (
                    <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                      <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[3/2] overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={relatedPost.featuredImage?.node.altText || relatedPost.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-serif text-base font-semibold leading-tight transition-colors group-hover:text-primary">
                            {relatedPost.title}
                          </h3>
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
