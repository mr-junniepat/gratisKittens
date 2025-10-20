import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { LanguageProvider } from "@/lib/language-context"
import { FavoritesProvider } from "@/lib/favorites-context"
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Gratis Kittens - Vind jouw perfecte kitten",
  description: "Het platform voor gratis kitten adoptie in Nederland. Geef een lief katje een warm thuis.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${outfit.variable} font-sans`}>
        <LanguageProvider>
          <FavoritesProvider>
            <Suspense fallback={null}>{children}</Suspense>
          </FavoritesProvider>
        </LanguageProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
