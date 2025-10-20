import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 to-background py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Vind jouw perfecte <span className="text-primary">kitten</span>
          </h1>
          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            Geef een lief katje een warm thuis. Ontdek beschikbare kittens bij jou in de buurt en maak kennis met je
            nieuwe beste vriend.
          </p>

          <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Zoek op locatie of ras..."
                className="h-12 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>
            <Button size="lg" className="h-12 px-8">
              Zoeken
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Populair:</span>
            <Button variant="outline" size="sm" className="rounded-full bg-transparent">
              Britse Korthaar
            </Button>
            <Button variant="outline" size="sm" className="rounded-full bg-transparent">
              Maine Coon
            </Button>
            <Button variant="outline" size="sm" className="rounded-full bg-transparent">
              Huiskat
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
