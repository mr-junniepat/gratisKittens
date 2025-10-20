import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, Clock, Users, Ticket, Search } from "lucide-react"
import Image from "next/image"
import { AdBanner } from "@/components/ad-banner"

const upcomingShows = [
  {
    id: 1,
    title: "Nationale Kattenshow Amsterdam",
    date: "25-26 mei 2025",
    startDate: "2025-05-25",
    location: "RAI Amsterdam",
    address: "Europaplein 24, 1078 GZ Amsterdam",
    time: "10:00 - 18:00",
    description:
      "De grootste kattenshow van Nederland met meer dan 500 katten uit verschillende rassen. Kom kijken naar prachtige raskatten, ontmoet fokkers en leer alles over kattenverzorging.",
    type: "Rassenshow",
    image: "/cat-show-amsterdam.jpg",
    price: "€12,50",
    attendees: "5000+",
    featured: true,
  },
  {
    id: 2,
    title: "Kitten Expo Rotterdam",
    date: "15 juni 2025",
    startDate: "2025-06-15",
    location: "Ahoy Rotterdam",
    address: "Ahoyweg 10, 3084 BA Rotterdam",
    time: "11:00 - 17:00",
    description:
      "Speciale show gericht op kittens en jonge katten. Perfect voor nieuwe kattenbaasjes! Inclusief workshops over kittenverzorging en gedragstraining.",
    type: "Kitten Show",
    image: "/kitten-expo-rotterdam.jpg",
    price: "€10,00",
    attendees: "2000+",
    featured: true,
  },
  {
    id: 3,
    title: "Internationale Kattenshow Utrecht",
    date: "8-9 juli 2025",
    startDate: "2025-07-08",
    location: "Jaarbeurs Utrecht",
    address: "Jaarbeursplein 6, 3521 AL Utrecht",
    time: "09:00 - 19:00",
    description:
      "Internationale show met deelnemers uit heel Europa. Bekijk zeldzame rassen, bijwoon demonstraties en ontmoet internationale experts.",
    type: "Internationale Show",
    image: "/cat-show-utrecht.jpg",
    price: "€15,00",
    attendees: "8000+",
    featured: true,
  },
  {
    id: 4,
    title: "Regionale Kattenshow Den Haag",
    date: "22 juli 2025",
    startDate: "2025-07-22",
    location: "Kyocera Stadion",
    address: "Forepark 2, 2548 BK Den Haag",
    time: "10:00 - 16:00",
    description:
      "Gezellige regionale show met lokale fokkers en hun prachtige katten. Ideaal voor een dagje uit met het gezin.",
    type: "Regionale Show",
    image: "/cat-show-den-haag.jpg",
    price: "€8,00",
    attendees: "1500+",
    featured: false,
  },
  {
    id: 5,
    title: "Bengalen & Exotische Rassen Show",
    date: "5 augustus 2025",
    startDate: "2025-08-05",
    location: "Evenementenhal Gorinchem",
    address: "Franklinweg 2, 4207 HZ Gorinchem",
    time: "11:00 - 18:00",
    description:
      "Speciale show gewijd aan Bengalen en andere exotische kattenrassen. Ontmoet fokkers en leer meer over deze bijzondere katten.",
    type: "Rasspecifieke Show",
    image: "/exotic-cat-show.jpg",
    price: "€11,00",
    attendees: "1000+",
    featured: false,
  },
  {
    id: 6,
    title: "Najaar Kattenshow Eindhoven",
    date: "12-13 september 2025",
    startDate: "2025-09-12",
    location: "Klokgebouw Eindhoven",
    address: "Klokgebouw 50, 5617 AB Eindhoven",
    time: "10:00 - 17:00",
    description:
      "Grote najaarsshow met honderden katten, workshops, demonstraties en een grote beurs met kattenproducten.",
    type: "Rassenshow",
    image: "/cat-show-eindhoven.jpg",
    price: "€12,00",
    attendees: "4000+",
    featured: false,
  },
]

const showTypes = [
  "Alle Shows",
  "Rassenshow",
  "Kitten Show",
  "Internationale Show",
  "Regionale Show",
  "Rasspecifieke Show",
]

export default function CatShowsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Kattenshows in Nederland
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Ontdek de mooiste kattenrassen, ontmoet fokkers en geniet van spectaculaire shows door heel Nederland
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Zoek shows op locatie of datum..."
                className="h-12 pl-12 pr-4 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      <AdBanner slot="cat-shows-top" />

      {/* Filter Categories */}
      <section className="border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {showTypes.map((type) => (
              <Button key={type} variant={type === "Alle Shows" ? "default" : "outline"} className="whitespace-nowrap">
                {type}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Shows */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 font-serif text-2xl font-bold md:text-3xl">Uitgelichte Shows</h2>
          <div className="grid gap-8 lg:grid-cols-3">
            {upcomingShows
              .filter((show) => show.featured)
              .map((show) => (
                <Card key={show.id} className="group overflow-hidden transition-all hover:shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={show.image || "/placeholder.svg"}
                      alt={show.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        {show.type}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="mb-4 font-serif text-xl font-semibold leading-tight">{show.title}</h3>

                    <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{show.date}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{show.time}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{show.location}</div>
                          <div className="text-xs">{show.address}</div>
                        </div>
                      </div>
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{show.description}</p>

                    <div className="mb-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Ticket className="h-4 w-4 text-primary" />
                        <span className="font-medium">{show.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{show.attendees} bezoekers</span>
                      </div>
                    </div>

                    <Button className="w-full">Meer Informatie</Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      <AdBanner slot="cat-shows-mid" />

      {/* All Shows */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 font-serif text-2xl font-bold md:text-3xl">Alle Aankomende Shows</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingShows.map((show) => (
              <Card key={show.id} className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image src={show.image || "/placeholder.svg"} alt={show.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {show.type}
                        </span>
                      </div>
                      <h3 className="mb-2 font-serif text-lg font-semibold leading-tight">{show.title}</h3>
                      <div className="mb-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{show.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{show.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium text-primary">{show.price}</span>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 font-serif text-2xl font-bold md:text-3xl">Wat kun je Verwachten op een Kattenshow?</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Kattenshows zijn fantastische evenementen waar kattenliefhebbers samenkomen om prachtige katten te
                bewonderen, fokkers te ontmoeten en meer te leren over verschillende rassen en kattenverzorging.
              </p>
              <p>
                Op een typische kattenshow vind je honderden katten van verschillende rassen, van populaire rassen zoals
                Britse Korthaar en Maine Coon tot zeldzame exotische rassen. Ervaren juryleden beoordelen de katten op
                basis van rasstandaarden, en je kunt getuige zijn van spannende wedstrijden en prijsuitreikingen.
              </p>
              <p>
                Naast het bewonderen van katten zijn er vaak workshops, demonstraties en informatieve presentaties over
                onderwerpen zoals kattenverzorging, voeding en gedrag. Er is meestal ook een beurs waar je
                kattenproducten kunt kopen, van speeltjes tot hoogwaardig voer.
              </p>
              <p>
                Of je nu overweegt een raskat aan te schaffen, gewoon van katten houdt, of meer wilt leren over
                kattenverzorging, een kattenshow is een leuke en leerzame ervaring voor het hele gezin!
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
