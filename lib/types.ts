export interface FeaturedImage {
  node: {
    sourceUrl: string
    altText: string
  }
}

export interface Author {
  node: {
    name: string
  }
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  date: string
  postViews?: number
  featuredImage?: FeaturedImage
  featuredImageUrl?: string
  attachments?: string[]
  author?: Author
  
  // Advertisement Info Fields (from WordPress admin)
  referenceId?: string
  todayViews?: number
  totalViews?: number
  postViews?: number
  postedFromIp?: string
  markedAsSold?: boolean
  
  // Advertisement Details Fields (from WordPress admin)
  isSought?: boolean
  numberOfKittens?: string
  toiletTrained?: string
  dateOfBirth?: string
  canBePickedUpFrom?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
  
  // Price Information Fields (from WordPress admin)
  adDuration?: string
  expiresOn?: string
  totalAdCost?: string
  
  // Legacy fields (for backward compatibility)
  kittenAge?: string
  kittenBreed?: string
  kittenGender?: string
  location?: string
  price?: string
  contactPhone?: string
  contactEmail?: string
  vaccinated?: string
  chipped?: string
  
  // Debug field
  customFields?: string
}

export interface KittenFields {
  age?: string
  breed?: string
  location?: string
  views?: number
  premium?: boolean
  postedBy?: string
}

export interface Kitten {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  date: string
  featuredImage?: FeaturedImage
  kittenFields?: KittenFields
}

export interface Page {
  id: string
  title: string
  slug: string
  content: string
}

export interface GeneralSettings {
  title: string
  description: string
  url: string
}

