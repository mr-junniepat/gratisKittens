"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { FavoriteButton } from "@/components/favorite-button"
import { LoginDialog } from "@/components/login-dialog"
import { useFavorites } from "@/lib/favorites-context"
import type { Post } from "@/lib/types"

interface AdDetailClientProps {
  adListing: Post
}

export function AdDetailClient({ adListing }: AdDetailClientProps) {
  const { showLoginDialog, setShowLoginDialog } = useFavorites()

  return (
    <>
      <div className="ml-auto flex gap-2">
        <FavoriteButton adId={adListing.id} />
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </>
  )
}
