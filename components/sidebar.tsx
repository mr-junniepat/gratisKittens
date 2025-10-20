import { Card } from "@/components/ui/card"
import { AlertTriangle, Info, MapPin, FileText } from "lucide-react"
import Link from "next/link"

export function Sidebar() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Info className="h-5 w-5 text-primary" />
          Welkom bij Gratis Kittens
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Post al uw gratis kittens en katten hier. Wij zijn de plek om te zijn voor kittens die u wilt weggeven of die
          u zoekt. Vind hier loving homes voor uw kittens of vind uw nieuwe beste vriend!
        </p>
      </Card>

      {/* Warning Section */}
      <Card className="border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-900 dark:text-amber-100">
          <AlertTriangle className="h-5 w-5" />
          Let op: Stamboom Katten
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
          Pas op voor advertenties voor stamboom katten! Als het te mooi lijkt om waar te zijn, is het dat
          waarschijnlijk ook. Vraag altijd om bewijs van stamboom en ontmoet de verkoper persoonlijk.
        </p>
      </Card>

      {/* Tips Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Tips voor Adoptie</h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Ontmoet het kitten altijd persoonlijk voordat u adopteert</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Vraag naar de medische geschiedenis en vaccinaties</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Zorg ervoor dat u klaar bent voor de verantwoordelijkheid</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Bereid uw huis voor op de komst van een kitten</span>
          </li>
        </ul>
      </Card>

      {/* Important Links */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5 text-primary" />
          Belangrijke Adressen
        </h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="#" className="text-primary hover:underline">
              Dierenartsen in Flevoland
            </Link>
          </li>
          <li>
            <Link href="#" className="text-primary hover:underline">
              Kattenopvang in Friesland
            </Link>
          </li>
          <li>
            <Link href="#" className="text-primary hover:underline">
              Veterinarians in Gelderland
            </Link>
          </li>
        </ul>
      </Card>

      {/* Recent Articles */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Recente Artikelen
        </h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/blog/eerste-dag-thuis" className="text-primary hover:underline">
              De Eerste Dag van je Kitten Thuis
            </Link>
          </li>
          <li>
            <Link href="/blog/kitten-voeding" className="text-primary hover:underline">
              Voedingsadvies voor Kittens
            </Link>
          </li>
          <li>
            <Link href="/blog/gezondheid" className="text-primary hover:underline">
              Gezondheid en Vaccinaties
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  )
}
