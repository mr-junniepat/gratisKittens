"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import Link from "next/link"
import { isAuthenticated, logoutUser } from "@/lib/auth"

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    logoutUser()
    setIsLoggedIn(false)
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="ghost" size="sm">
          Inloggen
        </Button>
      </Link>
      <Link href="/auth/register">
        <Button variant="outline" size="sm">
          Registreren
        </Button>
      </Link>
    </div>
  )
}
