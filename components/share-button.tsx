"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Share2, Facebook, Twitter, Linkedin, Link2, MessageCircle, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareButtonProps {
  title: string
  url?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "ghost" | "outline"
}

export function ShareButton({ title, url, size = "sm", variant = "ghost" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(shareUrl)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${encodedUrl}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link gekopieerd!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Kon link niet kopiëren")
    }
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="mr-2 h-4 w-4" />
          Delen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <Linkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Gekopieerd!
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Kopieer link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

