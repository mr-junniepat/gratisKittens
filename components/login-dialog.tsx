"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus } from "lucide-react"
import Link from "next/link"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Inloggen vereist
          </DialogTitle>
          <DialogDescription>
            Je moet ingelogd zijn om advertenties op te slaan in je favorieten.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              <LogIn className="mr-2 h-4 w-4" />
              Inloggen
            </Button>
          </Link>
          
          <Link href="/auth/register" className="w-full">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Account aanmaken
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground text-center pt-2">
          Na het inloggen kun je advertenties opslaan in je favorieten.
        </p>
      </DialogContent>
    </Dialog>
  )
}
