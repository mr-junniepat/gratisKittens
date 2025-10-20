"use client"

import { useEffect } from "react"

interface AdBannerProps {
  slot: string
  format?: "horizontal" | "vertical" | "rectangle"
}

export function AdBanner({ slot, format = "horizontal" }: AdBannerProps) {
  useEffect(() => {
    // Google AdSense script will be loaded in layout.tsx
    try {
      // @ts-ignore
      if (window.adsbygoogle) {
        // @ts-ignore
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (err) {
      console.error("Ad loading error:", err)
    }
  }, [])

  const getAdStyle = () => {
    switch (format) {
      case "horizontal":
        return "min-h-[90px] md:min-h-[120px]"
      case "vertical":
        return "min-h-[600px]"
      case "rectangle":
        return "min-h-[250px]"
      default:
        return "min-h-[90px]"
    }
  }

  return (
    <div className="container mx-auto px-4 pt-2 pb-6">
      <div className="flex items-center justify-center">
        <div
          className={`w-full max-w-5xl rounded-lg border border-border/40 bg-muted/20 ${getAdStyle()} flex items-center justify-center`}
        >
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          {/* Placeholder for development */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Advertentie Ruimte</p>
            <p className="text-xs">Google AdSense wordt hier weergegeven</p>
          </div>
        </div>
      </div>
    </div>
  )
}
