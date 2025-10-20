"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useFavorites } from "@/lib/favorites-context"

interface FavoriteButtonProps {
  adId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function FavoriteButton({ adId, variant = "outline", size = "sm", className }: FavoriteButtonProps) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites()

  const handleClick = () => {
    if (isFavorite(adId)) {
      removeFromFavorites(adId)
    } else {
      addToFavorites(adId)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleClick}
      className={className}
    >
      <Heart 
        className={`mr-2 h-4 w-4 ${isFavorite(adId) ? 'fill-red-500 text-red-500' : ''}`} 
      />
      {isFavorite(adId) ? 'Favoriet' : 'Favoriet'}
    </Button>
  )
}
