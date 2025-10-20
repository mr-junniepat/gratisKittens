import { Hero } from "@/components/hero"
import { FeaturedKittens } from "@/components/featured-kittens"
import { KittenListings } from "@/components/kitten-listings"
import { BlogPreview } from "@/components/blog-preview"
import { InfoSection } from "@/components/info-section"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AdBanner } from "@/components/ad-banner"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <Hero />
      
      <AdBanner slot="home-top" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <FeaturedKittens />
            <KittenListings />
            <BlogPreview />
          </div>
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>
      
      <AdBanner slot="home-bottom" />
      
      <InfoSection />
      
      <Footer />
    </div>
  )
}