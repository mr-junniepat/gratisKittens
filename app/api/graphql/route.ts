import { gql } from 'graphql-tag'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { execute } from 'graphql'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// GraphQL Schema
const typeDefs = gql`
  type Profile {
    id: ID!
    username: String!
    displayName: String
    email: String
    wordpressUserId: Int
    needsPasswordReset: Boolean!
    authUserCreated: Boolean!
    createdAt: String
    updatedAt: String
  }

  type AdListing {
    id: ID!
    title: String!
    content: String
    excerpt: String
    status: String!
    featuredImageUrl: String
    imageUrls: [String]
    location: String
    contactInfo: String
    price: String
    category: String
    tags: [String]
    authorId: String
    author: Profile
    createdAt: String
    updatedAt: String
    publishedAt: String
    totalViews: Int
    todayViews: Int
  }

  type BlogPost {
    id: ID!
    title: String!
    content: String
    excerpt: String
    status: String!
    featuredImageUrl: String
    imageUrls: [String]
    authorId: String
    author: Profile
    createdAt: String
    updatedAt: String
    publishedAt: String
  }

  type Favorite {
    id: ID!
    userId: String!
    adId: String!
    ad: AdListing
    user: Profile
    createdAt: String!
  }

  input AdListingInput {
    title: String!
    content: String
    excerpt: String
    location: String
    contactInfo: String
    price: String
    category: String
    tags: [String]
    featuredImageUrl: String
    imageUrls: [String]
  }

  input BlogPostInput {
    title: String!
    content: String
    excerpt: String
    featuredImageUrl: String
    imageUrls: [String]
  }

  type Query {
    # Ad Listings
    adListings(
      limit: Int
      offset: Int
      status: String
      category: String
      location: String
      search: String
    ): [AdListing!]!
    adListing(id: ID!): AdListing
    adListingBySlug(slug: String!): AdListing

    # Blog Posts
    blogPosts(
      limit: Int
      offset: Int
      status: String
      search: String
    ): [BlogPost!]!
    blogPost(id: ID!): BlogPost
    blogPostBySlug(slug: String!): BlogPost

    # Profiles
    profiles(limit: Int, offset: Int): [Profile!]!
    profile(id: ID!): Profile
    profileByUsername(username: String!): Profile

    # Favorites
    favorites(userId: String!): [Favorite!]!
    isFavorite(userId: String!, adId: String!): Boolean!
  }

  type Mutation {
    # Ad Listings
    createAdListing(input: AdListingInput!): AdListing!
    updateAdListing(id: ID!, input: AdListingInput!): AdListing!
    deleteAdListing(id: ID!): Boolean!

    # Blog Posts
    createBlogPost(input: BlogPostInput!): BlogPost!
    updateBlogPost(id: ID!, input: BlogPostInput!): BlogPost!
    deleteBlogPost(id: ID!): Boolean!

    # Favorites
    addFavorite(userId: String!, adId: String!): Favorite!
    removeFavorite(userId: String!, adId: String!): Boolean!
  }
`

// Resolvers
const resolvers = {
  BlogPost: {
    featuredImageUrl: (parent) => parent.featured_image_url,
    imageUrls: (parent) => parent.image_urls || [],
    authorId: (parent) => parent.author_id,
    createdAt: (parent) => parent.created_at,
    updatedAt: (parent) => parent.updated_at,
    publishedAt: (parent) => parent.published_at,
  },
  AdListing: {
    featuredImageUrl: (parent) => parent.featured_image_url,
    imageUrls: (parent) => parent.image_urls || [],
    authorId: (parent) => parent.author_id,
    createdAt: (parent) => parent.created_at,
    updatedAt: (parent) => parent.updated_at,
    publishedAt: (parent) => parent.published_at,
    totalViews: (parent) => parent.total_views || 0,
    todayViews: (parent) => parent.today_views || 0,
  },
  Query: {
    // Ad Listings
    adListings: async (_, { limit = 50, offset = 0, status, category, location, search }) => {
      // First get ads with images
      let queryWithImages = supabase
        .from('ad_listings')
        .select(`
          *,
          author:profiles(*)
        `)
        .not('featured_image_url', 'is', null)
        .order('created_at', { ascending: false })

      if (status) {
        queryWithImages = queryWithImages.eq('status', status)
      }
      if (category) {
        queryWithImages = queryWithImages.eq('category', category)
      }
      if (location) {
        queryWithImages = queryWithImages.ilike('location', `%${location}%`)
      }
      if (search) {
        queryWithImages = queryWithImages.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      const { data: adsWithImages, error: errorWithImages } = await queryWithImages
      if (errorWithImages) throw new Error(errorWithImages.message)

      // Then get ads without images
      let queryWithoutImages = supabase
        .from('ad_listings')
        .select(`
          *,
          author:profiles(*)
        `)
        .is('featured_image_url', null)
        .order('created_at', { ascending: false })

      if (status) {
        queryWithoutImages = queryWithoutImages.eq('status', status)
      }
      if (category) {
        queryWithoutImages = queryWithoutImages.eq('category', category)
      }
      if (location) {
        queryWithoutImages = queryWithoutImages.ilike('location', `%${location}%`)
      }
      if (search) {
        queryWithoutImages = queryWithoutImages.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      const { data: adsWithoutImages, error: errorWithoutImages } = await queryWithoutImages
      if (errorWithoutImages) throw new Error(errorWithoutImages.message)

      // Combine results: ads with images first, then ads without images
      const allAds = [...(adsWithImages || []), ...(adsWithoutImages || [])]
      
      // Apply pagination
      const startIndex = offset
      const endIndex = offset + limit
      return allAds.slice(startIndex, endIndex)
    },

    adListing: async (_, { id }) => {
      const { data, error } = await supabase
        .from('ad_listings')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    adListingBySlug: async (_, { slug }) => {
      const { data, error } = await supabase
        .from('ad_listings')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('slug', slug)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    // Blog Posts
    blogPosts: async (_, { limit = 50, offset = 0, status, search }) => {
      // First get posts with images
      let queryWithImages = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .not('featured_image_url', 'is', null)
        .order('created_at', { ascending: false })

      if (status) {
        queryWithImages = queryWithImages.eq('status', status)
      }
      if (search) {
        queryWithImages = queryWithImages.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      const { data: postsWithImages, error: errorWithImages } = await queryWithImages
      if (errorWithImages) throw new Error(errorWithImages.message)

      // Then get posts without images
      let queryWithoutImages = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .is('featured_image_url', null)
        .order('created_at', { ascending: false })

      if (status) {
        queryWithoutImages = queryWithoutImages.eq('status', status)
      }
      if (search) {
        queryWithoutImages = queryWithoutImages.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
      }

      const { data: postsWithoutImages, error: errorWithoutImages } = await queryWithoutImages
      if (errorWithoutImages) throw new Error(errorWithoutImages.message)

      // Combine results: posts with images first, then posts without images
      const allPosts = [...(postsWithImages || []), ...(postsWithoutImages || [])]
      
      // Apply pagination
      const startIndex = offset
      const endIndex = offset + limit
      return allPosts.slice(startIndex, endIndex)
    },

    blogPost: async (_, { id }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    blogPostBySlug: async (_, { slug }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('slug', slug)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    // Profiles
    profiles: async (_, { limit = 50, offset = 0 }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new Error(error.message)
      return data || []
    },

    profile: async (_, { id }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    profileByUsername: async (_, { username }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    // Favorites
    favorites: async (_, { userId }) => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          ad:ad_listings(*),
          user:profiles(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data || []
    },

    isFavorite: async (_, { userId, adId }) => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('ad_id', adId)
        .single()

      return !error && data !== null
    }
  },

  Mutation: {
    // Ad Listings
    createAdListing: async (_, { input }) => {
      const { data, error } = await supabase
        .from('ad_listings')
        .insert([{
          ...input,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          author:profiles(*)
        `)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    updateAdListing: async (_, { id, input }) => {
      const { data, error } = await supabase
        .from('ad_listings')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:profiles(*)
        `)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    deleteAdListing: async (_, { id }) => {
      const { error } = await supabase
        .from('ad_listings')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return true
    },

    // Blog Posts
    createBlogPost: async (_, { input }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([{
          ...input,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          author:profiles(*)
        `)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    updateBlogPost: async (_, { id, input }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:profiles(*)
        `)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    deleteBlogPost: async (_, { id }) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      return true
    },

    // Favorites
    addFavorite: async (_, { userId, adId }) => {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: userId,
          ad_id: adId,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          ad:ad_listings(*),
          user:profiles(*)
        `)
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    removeFavorite: async (_, { userId, adId }) => {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('ad_id', adId)

      if (error) throw new Error(error.message)
      return true
    }
  }
}

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

// GraphQL handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, variables, operationName } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const result = await execute({
      schema,
      document: gql(query),
      variableValues: variables,
      operationName,
      contextValue: {
        supabase,
        req: request
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GraphQL Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for GraphQL Playground (optional)
export async function GET() {
  return NextResponse.json({
    message: 'GraphQL API is running',
    endpoint: '/api/graphql',
    playground: process.env.NODE_ENV === 'development' ? 'Use POST requests with GraphQL queries' : 'Disabled in production'
  })
}
