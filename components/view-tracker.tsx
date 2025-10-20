'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  type: 'ad' | 'blog'
  id: string
}

export function ViewTracker({ type, id }: ViewTrackerProps) {
  useEffect(() => {
    // Track view when component mounts
    const trackView = async () => {
      try {
        await fetch('/api/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, id }),
        })
      } catch (error) {
        console.error('Failed to track view:', error)
      }
    }

    trackView()
  }, [type, id])

  return null // This component doesn't render anything
}
