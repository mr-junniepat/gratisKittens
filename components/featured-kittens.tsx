'use client'

import { KittenCard } from "@/components/kitten-card"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { getFallbackImage, formatDate } from "@/lib/wordpress-helpers"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface AdListing {
  id: string
  title: string
  content?: string
  excerpt?: string
  location?: string
  price?: string
  category?: string
  featuredImageUrl?: string
  imageUrls?: string[]
  totalViews?: number
  todayViews?: number
  author?: {
    username: string
    displayName?: string
  }
  createdAt: string
  publishedAt?: string
}

interface Kitten {
  id: string
  name: string
  age: string
  breed: string
  location: string
  image: string
  featured: boolean
  postedBy: string
  postedDate: string
  views: number
  slug: string
  gender: string
  price: string
  contactPhone: string
  contactEmail: string
  vaccinated: string
  chipped: string
  type: 'ad'
}

function FeaturedKittensSlider({ kittens }: { kittens: Kitten[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 4 // Show 4 items at a time
  const totalPages = Math.ceil(kittens.length / itemsPerPage)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const currentKittens = kittens.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  )

  return (
    <div className="relative">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {currentKittens.map((kitten) => (
          <KittenCard key={kitten.id} kitten={kitten} />
        ))}
      </div>
      
      {totalPages > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function FeaturedKittens() {
  const [kittens, setKittens] = useState<Kitten[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedKittens() {
      try {
        const response = await fetch('http://localhost:3000/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query {
                adListings(limit: 50, status: "published") {
                  id
                  title
                  content
                  excerpt
                  location
                  price
                  category
                  featuredImageUrl
                  imageUrls
                  totalViews
                  todayViews
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

        const allAds = data.data.adListings || []
        
        // Sort by most viewed (totalViews + todayViews)
        const sortedAds = allAds.sort((a: AdListing, b: AdListing) => {
          const aViews = (a.totalViews || 0) + (a.todayViews || 0)
          const bViews = (b.totalViews || 0) + (b.todayViews || 0)
          return bViews - aViews
        })
        
        // Take the top 10 most viewed ads
        const featuredAds = sortedAds.slice(0, 10)

        // Transform to kitten format
        const transformedKittens = featuredAds.map((ad) => {
          let imageUrl = getFallbackImage()
          if (ad.featuredImageUrl) {
            imageUrl = ad.featuredImageUrl
          } else if (ad.imageUrls && ad.imageUrls.length > 0) {
            imageUrl = ad.imageUrls[0]
          }

          return {
            id: ad.id,
            name: ad.title,
            age: "Onbekend",
            breed: ad.category || "Onbekend",
            location: ad.location || "Nederland",
            image: imageUrl,
            featured: true,
            postedBy: ad.author?.displayName || ad.author?.username || "Adverteerder",
            postedDate: formatDate(ad.publishedAt || ad.createdAt || new Date().toISOString()),
            views: (ad.totalViews || 0) + (ad.todayViews || 0),
            slug: ad.id,
            gender: "Onbekend",
            price: ad.price || "Gratis",
            contactPhone: "Onbekend",
            contactEmail: "Onbekend", 
            vaccinated: "Onbekend",
            chipped: "Onbekend",
            type: 'ad' as const,
          }
        })

        setKittens(transformedKittens)
      } catch (error) {
        console.error('❌ Error fetching featured kittens:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedKittens()
  }, [])

  if (loading) {
    return (
      <section id="featured" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Uitgelichte Kittens</h2>
            <p className="text-sm text-muted-foreground ml-4">Meest bekeken</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-square rounded-xl mb-4"></div>
                <div className="bg-muted h-4 rounded mb-2"></div>
                <div className="bg-muted h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="featured" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Uitgelichte Kittens</h2>
          <p className="text-sm text-muted-foreground ml-4">Meest bekeken</p>
        </div>

        {kittens.length > 0 ? (
          <FeaturedKittensSlider kittens={kittens} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Geen uitgelichte kittens beschikbaar op dit moment.</p>
          </div>
        )}
      </div>
    </section>
  )
}
