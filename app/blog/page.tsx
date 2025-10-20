import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Search, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AdBanner } from "@/components/ad-banner"
import { apolloClient } from "@/lib/apollo-client"
import { GET_POSTS } from "@/lib/queries"
import { stripHtml, formatDate, calculateReadingTime, getFallbackImage, getViewCount } from "@/lib/wordpress-helpers"
import type { Post } from "@/lib/types"

const categories = ["Alle", "Adoptie Tips", "Gedrag", "Voeding", "Training", "Verzorging", "Gezondheid"]

async function getBlogPosts() {
  try {
    const { data } = await apolloClient.query({
      query: GET_POSTS,
      variables: { first: 20 },
    })
    return (data as any).posts.nodes as Post[]
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export default async function BlogPage() {
  const posts: Post[] = await getBlogPosts()
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Kattenkennis & Verhalen
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Ontdek handige tips, inspirerende verhalen en expert advies over het verzorgen van je kitten
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Zoek artikelen..." className="h-12 pl-12 pr-4 text-base" />
            </div>
          </div>
        </div>
      </section>

      <AdBanner slot="blog-top" />

      {/* Categories */}
      <section className="border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "Alle" ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Geen blogposts gevonden.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const imageUrl = post.featuredImage?.node.sourceUrl || getFallbackImage()
                  const excerpt = stripHtml(post.excerpt)
                  const formattedDate = formatDate(post.date)
                  const readTime = post.content ? calculateReadingTime(post.content) : '5 min'
                  const viewCount = getViewCount(post)
                  
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[3/2] overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={post.featuredImage?.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardContent className="p-6">
                          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formattedDate}</span>
                            </div>
                            <span>•</span>
                            <span>{readTime} lezen</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{viewCount.toLocaleString()}</span>
                            </div>
                          </div>
                          <h3 className="mb-2 font-serif text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
                            {post.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
                          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                            Lees meer
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>

              {/* Load More */}
              {posts.length >= 20 && (
                <div className="mt-12 text-center">
                  <Button variant="outline" size="lg">
                    Meer Artikelen Laden
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <AdBanner slot="blog-bottom" />

      <Footer />
    </div>
  )
}
