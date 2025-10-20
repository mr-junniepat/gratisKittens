"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "nl" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  nl: {
    // Header
    "nav.kittens": "Kittens",
    "nav.blog": "Blog",
    "nav.catShows": "Kattenshows",
    "nav.catFood": "Kattenvoer",
    "nav.info": "Informatie",
    "nav.postAd": "Plaats Advertentie",

    // Hero
    "hero.title": "Vind jouw perfecte",
    "hero.titleHighlight": "kitten",
    "hero.subtitle":
      "Geef een lief katje een warm thuis. Ontdek beschikbare kittens bij jou in de buurt en maak kennis met je nieuwe beste vriend.",
    "hero.search": "Zoek op locatie of ras...",
    "hero.searchButton": "Zoeken",
    "hero.popular": "Populair:",
    "hero.breed1": "Britse Korthaar",
    "hero.breed2": "Maine Coon",
    "hero.breed3": "Huiskat",

    // Common
    "common.readMore": "Lees meer",
    "common.viewAll": "Bekijk alles",
    "common.search": "Zoeken",
  },
  en: {
    // Header
    "nav.kittens": "Kittens",
    "nav.blog": "Blog",
    "nav.catShows": "Cat Shows",
    "nav.catFood": "Cat Food",
    "nav.info": "Information",
    "nav.postAd": "Post Ad",

    // Hero
    "hero.title": "Find your perfect",
    "hero.titleHighlight": "kitten",
    "hero.subtitle":
      "Give a sweet kitten a warm home. Discover available kittens near you and meet your new best friend.",
    "hero.search": "Search by location or breed...",
    "hero.searchButton": "Search",
    "hero.popular": "Popular:",
    "hero.breed1": "British Shorthair",
    "hero.breed2": "Maine Coon",
    "hero.breed3": "Domestic Cat",

    // Common
    "common.readMore": "Read more",
    "common.viewAll": "View all",
    "common.search": "Search",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("nl")

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language
    if (saved && (saved === "nl" || saved === "en")) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.nl] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
