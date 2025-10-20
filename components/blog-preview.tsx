'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { stripHtml, formatDate, getFallbackImage } from "@/lib/wordpress-helpers"
import { useState, useEffect } from "react"

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
}

async function getFeaturedPosts(): Promise<BlogPost[]> {
  try {
    console.log('📝 Fetching blog posts from Supabase...')
    
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            blogPosts(limit: 10, status: "published") {
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
    
    // Filter for 2025 posts first, then fall back to recent posts
    const posts2025 = allPosts.filter(post => {
      const date = post.publishedAt || post.createdAt
      return date && date.startsWith('2025')
    })
    
    // If we have 2025 posts, use them; otherwise use the most recent posts
    const selectedPosts = posts2025.length >= 3 ? posts2025.slice(0, 3) : allPosts.slice(0, 3)
    
    console.log('📊 Posts from 2025:', posts2025.length)
    console.log('📊 Selected posts:', selectedPosts.length)
    
    return selectedPosts
  } catch (error) {
    console.error('❌ Error fetching blog posts:', error)
    return []
  }
}

export function BlogPreview() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const fetchedPosts = await getFeaturedPosts()
        setPosts(fetchedPosts)
        console.log("posts", fetchedPosts)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPosts()
  }, [])

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-3 font-serif text-3xl font-bold tracking-tight md:text-4xl">Laatste Verhalen & Tips</h2>
              <p className="text-lg text-muted-foreground">Ontdek handige tips en inspirerende verhalen over katten</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[3/2] bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-6 bg-muted rounded animate-pulse mb-3" />
                  <div className="h-3 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

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
            const viewCount = Math.floor(Math.random() * 1000) + 100 // Mock view count
            
            return (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6">
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
                    <p className="text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
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
