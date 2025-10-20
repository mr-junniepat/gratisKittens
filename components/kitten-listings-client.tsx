"use client"

import { KittenCard } from "@/components/kitten-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface Kitten {
  id: string
  name: string
  age: string
  breed: string
  location: string
  image: string
  postedBy: string
  postedDate: string
  views: number
  slug: string
  premium?: boolean
}

interface KittenListingsClientProps {
  kittens: Kitten[]
}

export function KittenListingsClient({ kittens }: KittenListingsClientProps) {
  return (
    <div id="kittens">
      <div className="mb-8">
        <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">Alle Beschikbare Kittens</h2>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Zoek op naam, ras, locatie..." className="pl-10" />
          </div>
          <Select defaultValue="recent">
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sorteer op" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="recent">Meest Recent</SelectItem>
              <SelectItem value="popular">Meest Populair</SelectItem>
              <SelectItem value="age-asc">Leeftijd (Laag-Hoog)</SelectItem>
              <SelectItem value="age-desc">Leeftijd (Hoog-Laag)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {kittens.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Geen kittens gevonden.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {kittens.map((kitten) => (
              <KittenCard key={kitten.id} kitten={kitten} />
            ))}
          </div>

          {kittens.length >= 20 && (
            <div className="mt-12 text-center">
              <Button size="lg" variant="outline">
                Meer Kittens Laden
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

