"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerUser } from "@/lib/auth"
import { toast } from "sonner"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Wachtwoorden komen niet overeen")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Wachtwoord moet minimaal 6 karakters lang zijn")
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser(
        formData.username,
        formData.email,
        formData.password
      )
      
      if (result.error) {
        setError(result.error)
      } else {
        toast.success("Account succesvol aangemaakt!")
        router.push("/auth/login")
      }
    } catch (error) {
      setError("Er is een fout opgetreden. Probeer het opnieuw.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="username">Gebruikersnaam</Label>
        <Input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Wachtwoord bevestigen</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registreren..." : "Registreren"}
      </Button>
    </form>
  )
}
