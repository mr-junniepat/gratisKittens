import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Registreren</CardTitle>
              <p className="text-muted-foreground">
                Maak een account aan om advertenties te plaatsen
              </p>
            </CardHeader>
            <CardContent>
              <RegisterForm />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Al een account?{' '}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Inloggen
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
