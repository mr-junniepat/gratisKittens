import { Card } from "@/components/ui/card"
import { Heart, Shield, Home, Users } from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "Gratis Adoptie",
    description: "Alle kittens op ons platform zijn gratis te adopteren. Geef een lief dier een tweede kans.",
  },
  {
    icon: Shield,
    title: "Veilig & Betrouwbaar",
    description: "We verifiëren alle adverteerders om een veilige adoptie-ervaring te garanderen.",
  },
  {
    icon: Home,
    title: "Lokaal Zoeken",
    description: "Vind kittens bij jou in de buurt en maak eenvoudig een afspraak voor een bezoek.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Krijg advies en ondersteuning van onze community van kattenliefhebbers.",
  },
]

export function InfoSection() {
  return (
    <section id="info" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Waarom Gratis Kittens?</h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            We helpen kittens en kattenliefhebbers bij elkaar te brengen voor een perfecte match
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
