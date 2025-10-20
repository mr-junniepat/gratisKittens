"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isAuthenticated } from './auth'

interface FavoritesContextType {
  favorites: string[]
  addToFavorites: (adId: string) => void
  removeFromFavorites: (adId: string) => void
  isFavorite: (adId: string) => boolean
  showLoginDialog: boolean
  setShowLoginDialog: (show: boolean) => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites))
        } catch (error) {
          console.error('Error loading favorites:', error)
        }
      }
    }
  }, [])

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(favorites))
    }
  }, [favorites])

  const addToFavorites = (adId: string) => {
    if (!isAuthenticated()) {
      setShowLoginDialog(true)
      return
    }

    setFavorites(prev => {
      if (!prev.includes(adId)) {
        return [...prev, adId]
      }
      return prev
    })
  }

  const removeFromFavorites = (adId: string) => {
    setFavorites(prev => prev.filter(id => id !== adId))
  }

  const isFavorite = (adId: string) => {
    return favorites.includes(adId)
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      showLoginDialog,
      setShowLoginDialog
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
