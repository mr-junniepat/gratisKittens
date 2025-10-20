import { KittenListingsClient } from "./kitten-listings-client"
import { formatDate, getFallbackImage } from "@/lib/wordpress-helpers"

interface AdListing {
  id: string
  title: string
  content: string
  excerpt: string
  location: string
  price: string
  category: string
  featuredImageUrl: string
  imageUrls: string[]
  author: {
    username: string
    displayName: string
  }
  createdAt: string
  publishedAt: string
  status: string
}

async function getKittens(): Promise<AdListing[]> {
  try {
    console.log('🔍 Fetching ad listings from Supabase...')

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
              author {
                username
                displayName
              }
              createdAt
              publishedAt
              status
            }
          }
        `,
      }),
    })

    const { data, errors } = await response.json()

    if (errors) {
      console.error('❌ GraphQL errors fetching ad listings:', errors)
      return []
    }

    const allAds = data.adListings || []
    
    // Sort by newest first (createdAt)
    const sortedAds = allAds.sort((a: AdListing, b: AdListing) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log(`📊 Total ads fetched: ${sortedAds.length}`)
    return sortedAds
  } catch (error) {
    console.error('❌ Error fetching ad listings:', error)
    return []
  }
}

export async function KittenListings() {
  const adListings = await getKittens()

  console.log('📝 Total ad listings fetched:', adListings.length)

  // Transform Supabase ad listings to kitten format
  const kittens = adListings.map((ad) => {
    // Get image from featured image or first image in array
    let imageUrl = getFallbackImage()
    if (ad.featuredImageUrl) {
      imageUrl = ad.featuredImageUrl
    } else if (ad.imageUrls && ad.imageUrls.length > 0) {
      imageUrl = ad.imageUrls[0]
    }

    return {
      id: ad.id,
      name: ad.title,
      age: "Onbekend", // We'll need to extract this from content if available
      breed: ad.category || "Onbekend",
      location: ad.location || "Nederland",
      image: imageUrl,
      postedBy: ad.author?.displayName || ad.author?.username || "Adverteerder",
      postedDate: formatDate(ad.publishedAt || ad.createdAt || new Date().toISOString()),
      views: Math.floor(Math.random() * 1000) + 100, // Mock view count for now
      slug: ad.id, // Using ID as slug for now
      // Additional fields for detail view
      gender: "Onbekend",
      price: ad.price || "Gratis",
      contactPhone: "Onbekend",
      contactEmail: "Onbekend",
      vaccinated: "Onbekend",
      chipped: "Onbekend",
      // All ad listings are type 'ad'
      type: 'ad' as const,
    }
  })

  console.log('✨ Transformed Kittens:', kittens)
  console.log('🔢 Number of kittens to display:', kittens.length)

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">Alle Kitten Advertenties</h2>
          <p className="text-muted-foreground">Nieuwste advertenties eerst</p>
        </div>
        
        {kittens.length >= 12 ? (
          <KittenListingsClient kittens={kittens} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Er zijn momenteel {kittens.length} advertenties beschikbaar. 
              {kittens.length < 12 && " Er zijn meer advertenties nodig om de volledige lijst te tonen."}
            </p>
            {kittens.length > 0 && <KittenListingsClient kittens={kittens} />}
          </div>
        )}
      </div>
    </section>
  )
}
