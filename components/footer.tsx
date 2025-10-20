import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image src="/gslogo.png" alt="Gratis Kittens Logo" width={24} height={24} className="h-6 w-6" />
              <span className="text-lg font-semibold">Gratis Kittens</span>
            </div>
            <p className="text-sm text-muted-foreground">Het platform voor gratis kitten adoptie in Nederland</p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Navigatie</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#kittens" className="hover:text-foreground">
                  Alle Kittens
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/cat-shows" className="hover:text-foreground">
                  Kattenshows
                </Link>
              </li>
              <li>
                <Link href="/cat-food" className="hover:text-foreground">
                  Kattenvoer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Hulp</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Veelgestelde Vragen
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Adoptie Tips
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Over Ons
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Juridisch</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Privacybeleid
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Algemene Voorwaarden
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Cookie Beleid
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Gratis Kittens. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  )
}
