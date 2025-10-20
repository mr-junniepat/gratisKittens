import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Star, Search, Award } from "lucide-react"
import Image from "next/image"
import { AdBanner } from "@/components/ad-banner"

const topRatedFoods = [
  {
    id: 1,
    name: "Royal Canin Kitten",
    brand: "Royal Canin",
    rating: 4.8,
    reviews: 1247,
    price: "€24,99",
    pricePerKg: "€6,25/kg",
    image: "/cat-food-royal-canin.jpg",
    category: "Droogvoer",
    ageGroup: "Kittens",
    features: ["Hoge voedingswaarde", "Speciaal voor kittens", "Ondersteunt groei"],
    badge: "Beste Keuze",
  },
  {
    id: 2,
    name: "Hill's Science Plan Kitten",
    brand: "Hill's",
    rating: 4.7,
    reviews: 892,
    price: "€22,50",
    pricePerKg: "€5,63/kg",
    image: "/cat-food-hills.jpg",
    category: "Droogvoer",
    ageGroup: "Kittens",
    features: ["Wetenschappelijk ontwikkeld", "Gezonde ontwikkeling", "Natuurlijke ingrediënten"],
    badge: "Top Beoordeeld",
  },
  {
    id: 3,
    name: "Purina Pro Plan Junior",
    brand: "Purina",
    rating: 4.6,
    reviews: 1056,
    price: "€19,99",
    pricePerKg: "€5,00/kg",
    image: "/cat-food-purina.jpg",
    category: "Droogvoer",
    ageGroup: "Kittens",
    features: ["Goede prijs-kwaliteit", "Rijk aan proteïne", "Glanzende vacht"],
    badge: "Beste Prijs",
  },
]

const allFoods = [
  ...topRatedFoods,
  {
    id: 4,
    name: "Whiskas Junior Natvoer",
    brand: "Whiskas",
    rating: 4.4,
    reviews: 2341,
    price: "€15,99",
    pricePerKg: "€4,00/kg",
    image: "/cat-food-whiskas.jpg",
    category: "Natvoer",
    ageGroup: "Kittens",
    features: ["Hoge acceptatie", "Veel variatie", "Betaalbaar"],
    badge: null,
  },
  {
    id: 5,
    name: "Orijen Cat & Kitten",
    brand: "Orijen",
    rating: 4.9,
    reviews: 567,
    price: "€34,99",
    pricePerKg: "€8,75/kg",
    image: "/cat-food-orijen.jpg",
    category: "Droogvoer",
    ageGroup: "Alle leeftijden",
    features: ["Premium kwaliteit", "Biologisch", "Graanvrij"],
    badge: "Premium",
  },
  {
    id: 6,
    name: "Felix Kitten Natvoer Mix",
    brand: "Felix",
    rating: 4.5,
    reviews: 1823,
    price: "€12,99",
    pricePerKg: "€3,25/kg",
    image: "/cat-food-felix.jpg",
    category: "Natvoer",
    ageGroup: "Kittens",
    features: ["Veel smaken", "Goede prijs", "Populair bij katten"],
    badge: null,
  },
  {
    id: 7,
    name: "Applaws Kitten Kip",
    brand: "Applaws",
    rating: 4.7,
    reviews: 634,
    price: "€28,50",
    pricePerKg: "€7,13/kg",
    image: "/cat-food-applaws.jpg",
    category: "Natvoer",
    ageGroup: "Kittens",
    features: ["100% natuurlijk", "Hoog vleesgehalte", "Geen toevoegingen"],
    badge: "Natuurlijk",
  },
  {
    id: 8,
    name: "Iams Kitten & Junior",
    brand: "Iams",
    rating: 4.5,
    reviews: 945,
    price: "€21,99",
    pricePerKg: "€5,50/kg",
    image: "/cat-food-iams.jpg",
    category: "Droogvoer",
    ageGroup: "Kittens",
    features: ["Goede voedingswaarde", "Betaalbaar", "Breed verkrijgbaar"],
    badge: null,
  },
]

const categories = ["Alle", "Droogvoer", "Natvoer", "Premium", "Budget"]
const ageGroups = ["Alle leeftijden", "Kittens", "Volwassen", "Senior"]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  )
}

export default function CatFoodPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Kattenvoer Reviews & Vergelijkingen
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Vind het beste voer voor je kitten met onze uitgebreide reviews en vergelijkingen
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Zoek kattenvoer merken..." className="h-12 pl-12 pr-4 text-base" />
            </div>
          </div>
        </div>
      </section>

      <AdBanner slot="cat-food-top" />

      {/* Top Rated Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            <h2 className="font-serif text-2xl font-bold md:text-3xl">Top 3 Beste Kittenvoer</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {topRatedFoods.map((food, index) => (
              <Card key={food.id} className="group relative overflow-hidden transition-all hover:shadow-xl">
                {food.badge && (
                  <div className="absolute right-4 top-4 z-10">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
                      {food.badge}
                    </span>
                  </div>
                )}
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                  <Image
                    src={food.image || "/placeholder.svg"}
                    alt={food.name}
                    fill
                    className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="mb-2 text-sm font-medium text-primary">{food.brand}</div>
                  <h3 className="mb-3 font-serif text-xl font-semibold leading-tight">{food.name}</h3>

                  <div className="mb-3 flex items-center gap-2">
                    <StarRating rating={food.rating} />
                    <span className="text-sm font-medium">{food.rating}</span>
                    <span className="text-sm text-muted-foreground">({food.reviews} reviews)</span>
                  </div>

                  <div className="mb-4 space-y-1">
                    {food.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{food.price}</span>
                    <span className="text-sm text-muted-foreground">{food.pricePerKg}</span>
                  </div>

                  <Button className="w-full">Bekijk Review</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <AdBanner slot="cat-food-mid" />

      {/* Filter Section */}
      <section className="border-y bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold">Categorie</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "Alle" ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Leeftijdsgroep</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {ageGroups.map((group) => (
                <Button key={group} variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
                  {group}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 font-serif text-2xl font-bold md:text-3xl">Alle Kattenvoer Reviews</h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {allFoods.map((food) => (
              <Card key={food.id} className="group overflow-hidden transition-all hover:shadow-lg">
                {food.badge && (
                  <div className="absolute right-2 top-2 z-10">
                    <span className="rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      {food.badge}
                    </span>
                  </div>
                )}
                <div className="relative aspect-square overflow-hidden bg-muted/30">
                  <Image
                    src={food.image || "/placeholder.svg"}
                    alt={food.name}
                    fill
                    className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="mb-1 text-xs font-medium text-primary">{food.brand}</div>
                  <h3 className="mb-2 font-serif text-base font-semibold leading-tight">{food.name}</h3>

                  <div className="mb-2 flex items-center gap-1">
                    <StarRating rating={food.rating} />
                    <span className="text-xs font-medium">{food.rating}</span>
                  </div>

                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">{food.price}</span>
                    <span className="text-xs text-muted-foreground">{food.pricePerKg}</span>
                  </div>

                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Bekijk Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Buying Guide */}
      <section className="border-t bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 font-serif text-2xl font-bold md:text-3xl">Koopgids: Het Juiste Kittenvoer Kiezen</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">Waarom is Speciaal Kittenvoer Belangrijk?</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Kittens hebben andere voedingsbehoeften dan volwassen katten. Ze groeien snel en hebben meer energie,
                  proteïne en specifieke voedingsstoffen nodig voor een gezonde ontwikkeling. Speciaal kittenvoer is
                  afgestemd op deze behoeften en ondersteunt de groei van botten, spieren en het immuunsysteem.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">Droogvoer vs. Natvoer</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Beide soorten voer hebben hun voordelen. Droogvoer is praktisch, betaalbaar en goed voor de tanden.
                  Natvoer bevat meer vocht, wat goed is voor de hydratatie en vaak lekkerder voor kieskeurige eters.
                  Veel eigenaren kiezen voor een combinatie van beide.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">Waar Let je op bij het Kiezen?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">Leeftijd:</strong> Kies voer dat specifiek is ontwikkeld voor
                      kittens (tot 12 maanden)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">Ingrediënten:</strong> Zoek naar hoogwaardig vlees als eerste
                      ingrediënt
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">Voedingswaarde:</strong> Minimaal 30% proteïne en 9% vet voor
                      kittens
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">Budget:</strong> Investeer in kwaliteit, maar er zijn goede
                      opties in elk prijssegment
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
                <p className="text-sm leading-relaxed">
                  <strong>Tip:</strong> Wissel niet te vaak van voer. Als je wilt overstappen, doe dit dan geleidelijk
                  over een periode van 7-10 dagen om maagproblemen te voorkomen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
