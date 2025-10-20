import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Inloggen</CardTitle>
              <p className="text-muted-foreground">
                Log in op je account om advertenties te beheren
              </p>
            </CardHeader>
            <CardContent>
              <LoginForm />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nog geen account?{' '}
                  <Link href="/auth/register" className="text-primary hover:underline">
                    Registreren
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
