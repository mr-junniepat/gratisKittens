"use client"

import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "nl" ? "en" : "nl")} className="gap-2">
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">{language === "nl" ? "EN" : "NL"}</span>
    </Button>
  )
}
