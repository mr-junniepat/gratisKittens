"use client"

import { Button } from "@/components/ui/button"
import { Menu, Plus, User, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { AuthButton } from "@/components/auth-button"

export function Header() {
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/gslogo.png" alt="Gratis Kittens Logo" width={32} height={32} className="h-8 w-8" />
          <span className="text-2xl font-semibold tracking-tight">Gratis Kittens</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#kittens" className="text-sm font-medium transition-colors hover:text-primary">
            {t("nav.kittens")}
          </Link>
          <Link href="/blog" className="text-sm font-medium transition-colors hover:text-primary">
            {t("nav.blog")}
          </Link>
          <Link href="/cat-shows" className="text-sm font-medium transition-colors hover:text-primary">
            {t("nav.catShows")}
          </Link>
          <Link href="/cat-food" className="text-sm font-medium transition-colors hover:text-primary">
            {t("nav.catFood")}
          </Link>
          <Link href="/#info" className="text-sm font-medium transition-colors hover:text-primary">
            {t("nav.info")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <AuthButton />
          <Button className="hidden md:inline-flex gap-2 bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            {t("nav.postAd")}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
