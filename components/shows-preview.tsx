import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"

const upcomingShows = [
  {
    id: 1,
    title: "Nationale Kattenshow Amsterdam",
    date: "25-26 mei 2025",
    location: "RAI Amsterdam",
    description: "De grootste kattenshow van Nederland met meer dan 500 katten uit verschillende rassen.",
    type: "Rassenshow",
  },
  {
    id: 2,
    title: "Kitten Expo Rotterdam",
    date: "15 juni 2025",
    location: "Ahoy Rotterdam",
    description: "Speciale show gericht op kittens en jonge katten. Perfect voor nieuwe kattenbaasjes!",
    type: "Kitten Show",
  },
  {
    id: 3,
    title: "Internationale Kattenshow Utrecht",
    date: "8-9 juli 2025",
    location: "Jaarbeurs Utrecht",
    description: "Internationale show met deelnemers uit heel Europa. Inclusief workshops en demonstraties.",
    type: "Internationale Show",
  },
]

export function ShowsPreview() {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="mb-3 font-serif text-3xl font-bold tracking-tight md:text-4xl">Aankomende Kattenshows</h2>
            <p className="text-lg text-muted-foreground">Bezoek de leukste kattenshow evenementen in Nederland</p>
          </div>
          <Link href="/cat-shows">
            <Button variant="outline" className="hidden md:inline-flex bg-transparent">
              Alle Shows
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {upcomingShows.map((show) => (
            <Card key={show.id} className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {show.type}
                  </span>
                </div>
                <h3 className="mb-4 font-serif text-xl font-semibold leading-tight">{show.title}</h3>
                <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{show.date}</span>
                </div>
                <div className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{show.location}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{show.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/cat-shows">
            <Button variant="outline">
              Alle Shows
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
