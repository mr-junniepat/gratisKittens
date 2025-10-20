import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MapPin, Calendar, Heart, Eye, User } from "lucide-react"
import Link from "next/link"
import { FavoriteButton } from "@/components/favorite-button"

interface Kitten {
  id: string
  name: string
  age: string
  breed: string
  location: string
  image: string
  featured?: boolean
  premium?: boolean
  postedBy?: string
  postedDate?: string
  views?: number
  slug?: string
  type?: 'ad' | 'blog' // Add type to distinguish between ads and blog posts
}

interface KittenCardProps {
  kitten: Kitten
}

export function KittenCard({ kitten }: KittenCardProps) {
  const cardContent = (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {kitten.premium && (
          <div className="absolute left-0 top-4 z-10 bg-accent px-4 py-1 text-xs font-bold uppercase text-accent-foreground shadow-md">
            Premium
          </div>
        )}
        <img
          src={kitten.image || "/placeholder.svg"}
          alt={kitten.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {kitten.featured && (
          <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Uitgelicht
          </div>
        )}
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
          <FavoriteButton 
            adId={kitten.id} 
            variant="ghost" 
            size="sm"
            className="rounded-full bg-card/90 backdrop-blur-sm p-2 shadow-lg hover:bg-card"
          />
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 text-xl font-semibold">{kitten.name}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{kitten.breed}</p>

        <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{kitten.age}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{kitten.location}</span>
          </div>
          {kitten.postedBy && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{kitten.postedBy}</span>
            </div>
          )}
          {kitten.postedDate && (
            <div className="flex items-center gap-2 text-xs">
              <span>{kitten.postedDate}</span>
            </div>
          )}
          {kitten.views && (
            <div className="flex items-center gap-2 text-xs">
              <Eye className="h-4 w-4" />
              <span>{kitten.views.toLocaleString()} views</span>
            </div>
          )}
        </div>

        <Button className="w-full">Meer Informatie</Button>
      </div>
    </Card>
  )

  // If we have a slug, make the card clickable
  if (kitten.slug) {
    // Determine the correct route based on type
    const href = kitten.type === 'blog' ? `/blog/${kitten.slug}` : `/ads/${kitten.slug}`
    
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  // Otherwise, return the card without link
  return cardContent
}
