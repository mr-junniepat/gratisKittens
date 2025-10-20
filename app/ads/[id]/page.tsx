import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, ArrowLeft, Eye, MapPin, Heart, Phone, Mail, Shield, Microchip } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AdBanner } from "@/components/ad-banner"
import { ShareButton } from "@/components/share-button"
import { AdDetailClient } from "@/components/ad-detail-client"
import { formatDate, getFallbackImage } from "@/lib/wordpress-helpers"
import { notFound } from "next/navigation"

interface AdListing {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  
  // Kitten Details
  kittenAge?: string
  kittenBreed?: string
  kittenGender?: string
  numberOfKittens?: number
  dateOfBirth?: string
  
  // Location
  city?: string
  province?: string
  country?: string
  postalCode?: string
  
  // Contact
  contactPhone?: string
  contactEmail?: string
  
  // Health
  vaccinated?: boolean
  chipped?: boolean
  toiletTrained?: boolean
  
  // Pricing & Status
  price?: number
  isFree?: boolean
  markedAsSold?: boolean
  isSought?: boolean
  
  // Analytics
  totalViews?: number
  todayViews?: number
  
  // Media
  featuredImageUrl?: string
  imageUrls?: string[]
  
  // Author
  author?: {
    id: string
    username: string
    displayName?: string
  }
}

async function getAdListing(id: string): Promise<AdListing | null> {
  try {
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetAdListing($id: ID!) {
            adListing(id: $id) {
              id
              title
              slug
              content
              excerpt
              status
              createdAt
              updatedAt
              publishedAt
              kittenAge
              kittenBreed
              kittenGender
              numberOfKittens
              dateOfBirth
              city
              province
              country
              postalCode
              contactPhone
              contactEmail
              vaccinated
              chipped
              toiletTrained
              price
              isFree
              markedAsSold
              isSought
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
    
    return data.adListing
  } catch (error) {
    console.error('Error fetching ad listing:', error)
    return null
  }
}

async function getRelatedAds(): Promise<AdListing[]> {
  try {
    const response = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetAdListings {
            adListings(limit: 4, status: "published") {
              id
              title
              slug
              createdAt
              featuredImageUrl
              kittenAge
              city
              province
              country
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
    
    return data.adListings
  } catch (error) {
    console.error('Error fetching related ads:', error)
    return []
  }
}

export default async function AdListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adListing = await getAdListing(id)

  if (!adListing) {
    notFound()
  }

  const relatedAds = await getRelatedAds()
  const imageUrl = adListing.featuredImageUrl || getFallbackImage()
  const viewCount = (adListing.totalViews || 0) + (adListing.todayViews || 0)

  return (
    <div className="min-h-screen">
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

      {/* Ad Listing Header */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Title */}
            <h1 className="mb-6 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {adListing.title}
            </h1>

            {/* Meta Info */}
            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <span className="font-medium text-foreground">{adListing.author?.displayName || adListing.author?.username || 'Adverteerder'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(adListing.createdAt)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
              <div className="ml-auto flex gap-2">
                <AdDetailClient adListing={adListing} />
                <ShareButton title={adListing.title} />
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={adListing.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Additional Images */}
            {adListing.imageUrls && adListing.imageUrls.length > 1 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Meer foto's</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {adListing.imageUrls.slice(1, 5).map((imageUrl: string, index: number) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={imageUrl}
                        alt={`${adListing.title} - Foto ${index + 2}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AdBanner slot="ad-listing-top" />

            {/* Ad Content */}
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div>
                {/* Kitten Details */}
                <div className="mb-8 p-6 bg-muted/30 rounded-lg">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Heart className="h-6 w-6 text-primary" />
                    Kitten Details
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Leeftijd:</span> 
                      <span>{adListing.kittenAge || adListing.dateOfBirth || "Onbekend"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Ras:</span> 
                      <span>{adListing.kittenBreed || "Onbekend"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Geslacht:</span> 
                      <span>{adListing.kittenGender || "Onbekend"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Aantal kittens:</span> 
                      <span>{adListing.numberOfKittens || "Onbekend"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Locatie:</span> 
                      <span>{adListing.city || adListing.province || adListing.country || "Nederland"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Postcode:</span> 
                      <span>{adListing.postalCode || "Onbekend"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Prijs:</span> 
                      <span className="font-semibold text-primary">{adListing.isFree ? "Gratis" : (adListing.price ? `€${adListing.price}` : "Gratis")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Geplaatst:</span> 
                      <span>{formatDate(adListing.createdAt)}</span>
                    </div>
                    {adListing.isSought && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">Type:</span> 
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Gezocht</span>
                      </div>
                    )}
                    {adListing.markedAsSold && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">Status:</span> 
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Verkocht</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Information */}
                <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-green-600" />
                    Gezondheidsinformatie
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-muted-foreground">Gevaccineerd:</span> 
                      <span className="text-green-600 dark:text-green-400">
                        {adListing.vaccinated !== undefined ? (adListing.vaccinated ? "Ja" : "Nee") : "Onbekend"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Microchip className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-muted-foreground">Gechipt:</span> 
                      <span className="text-green-600 dark:text-green-400">
                        {adListing.chipped !== undefined ? (adListing.chipped ? "Ja" : "Nee") : "Onbekend"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Zindelijk:</span> 
                      <span className="text-green-600 dark:text-green-400">
                        {adListing.toiletTrained !== undefined ? (adListing.toiletTrained ? "Ja" : "Nee") : "Onbekend"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Geboortedatum:</span> 
                      <span className="text-green-600 dark:text-green-400">
                        {adListing.dateOfBirth || "Onbekend"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ad Statistics */}
                <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-gray-600" />
                    Advertentie Statistieken
                  </h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-muted-foreground">Vandaag bekeken:</span> 
                      <span className="font-semibold">{adListing.todayViews || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-muted-foreground">Totaal bekeken:</span> 
                      <span className="font-semibold">{adListing.totalViews || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-muted-foreground">Geplaatst op:</span> 
                      <span className="font-semibold">{formatDate(adListing.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Beschrijving</h2>
                  <div
                    dangerouslySetInnerHTML={{ __html: adListing.content || adListing.excerpt || '' }}
                    style={{
                      fontSize: "1.0625rem",
                      lineHeight: "1.75",
                    }}
                  />
                </div>

                <AdBanner slot="ad-listing-mid" />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Contact Informatie</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{adListing.author?.displayName || adListing.author?.username || 'Adverteerder'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Geplaatst op {formatDate(adListing.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{adListing.city || adListing.province || adListing.country || 'Nederland'}</span>
                      </div>
                      {adListing.contactPhone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Telefoon:</span>
                          <a href={`tel:${adListing.contactPhone}`} className="text-primary hover:underline">
                            {adListing.contactPhone}
                          </a>
                        </div>
                      )}
                      {adListing.contactEmail && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">E-mail:</span>
                          <a href={`mailto:${adListing.contactEmail}`} className="text-primary hover:underline">
                            {adListing.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 space-y-2">
                      {(adListing.contactPhone || adListing.contactEmail) ? (
                        <Button className="w-full" asChild>
                          <a href={adListing.contactPhone ? `tel:${adListing.contactPhone}` : `mailto:${adListing.contactEmail}`}>
                            Contact Opnemen
                          </a>
                        </Button>
                      ) : (
                        <Button className="w-full" disabled>
                          Contact Opnemen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Safety Tips */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Veiligheidstips</h3>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• Ontmoet altijd in een openbare ruimte</li>
                      <li>• Neem iemand mee naar de ontmoeting</li>
                      <li>• Controleer de gezondheid van het dier</li>
                      <li>• Vraag om bewijs van vaccinaties</li>
                      <li>• Wees voorzichtig met vooruitbetalingen</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Ads */}
      {relatedAds.length > 0 && (
        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-8 font-serif text-2xl font-bold md:text-3xl">Andere Advertenties</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedAds.filter(ad => ad.id !== id).slice(0, 3).map((relatedAd) => {
                  const relatedImageUrl = relatedAd.featuredImageUrl || getFallbackImage()

                  return (
                    <Link key={relatedAd.id} href={`/ads/${relatedAd.id}`}>
                      <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[3/2] overflow-hidden">
                          <Image
                            src={relatedImageUrl}
                            alt={relatedAd.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-serif text-base font-semibold leading-tight transition-colors group-hover:text-primary">
                            {relatedAd.title}
                          </h3>
                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            <p>{formatDate(relatedAd.createdAt)}</p>
                            {relatedAd.kittenAge && (
                              <p className="text-xs">Leeftijd: {relatedAd.kittenAge}</p>
                            )}
                            {(relatedAd.city || relatedAd.province) && (
                              <p className="text-xs">Locatie: {relatedAd.city || relatedAd.province}</p>
                            )}
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
