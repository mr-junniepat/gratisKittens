/**
 * Helper functions for WordPress data processing
 */

/**
 * Strips HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Formats a WordPress date to a readable format
 */
export function formatDate(dateString: string, locale: string = 'nl-NL'): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Calculates estimated reading time based on content
 */
export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const text = stripHtml(content)
  const wordCount = text.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min`
}

/**
 * Decodes HTML entities (like &nbsp;, &amp;, etc.)
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' ',
  }
  
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match)
}

/**
 * Gets a fallback image if no featured image is available
 */
export function getFallbackImage(): string {
  return '/placeholder.jpg'
}

/**
 * Truncates text to a specific length
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Gets view count - uses WordPress data if available, otherwise generates consistent fallback
 */
export function getViewCount(post: { postViews?: number; id: string }): number {
  // If WordPress has view count data, use it
  if (post.postViews && post.postViews > 0) {
    return post.postViews
  }
  
  // Otherwise generate a consistent number based on post ID
  // This ensures the same post always shows the same view count
  const hash = post.id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  return 500 + (hash % 4500) // Returns a number between 500-5000
}

