# Supabase GraphQL API Documentation

## Overview

This GraphQL API provides access to your migrated WordPress data stored in Supabase. It includes ad listings, blog posts, user profiles, and favorites functionality.

## Endpoint

- **URL:** `/api/graphql`
- **Method:** POST
- **Content-Type:** application/json

## Schema Types

### Profile
```graphql
type Profile {
  id: ID!
  username: String!
  displayName: String
  email: String
  wordpressUserId: Int
  needsPasswordReset: Boolean!
  authUserCreated: Boolean!
  createdAt: String!
  updatedAt: String!
}
```

### AdListing
```graphql
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
  createdAt: String!
  updatedAt: String!
  publishedAt: String
}
```

### BlogPost
```graphql
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
  createdAt: String!
  updatedAt: String!
  publishedAt: String
}
```

### Favorite
```graphql
type Favorite {
  id: ID!
  userId: String!
  adId: String!
  ad: AdListing
  user: Profile
  createdAt: String!
}
```

## Queries

### Ad Listings

#### Get Ad Listings
```graphql
query GetAdListings($limit: Int, $offset: Int, $status: String, $category: String, $location: String, $search: String) {
  adListings(limit: $limit, offset: $offset, status: $status, category: $category, location: $location, search: $search) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    location
    contactInfo
    price
    category
    tags
    authorId
    author {
      id
      username
      displayName
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

#### Get Single Ad Listing
```graphql
query GetAdListing($id: ID!) {
  adListing(id: $id) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    location
    contactInfo
    price
    category
    tags
    authorId
    author {
      id
      username
      displayName
      email
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

#### Get Ad Listing by Slug
```graphql
query GetAdListingBySlug($slug: String!) {
  adListingBySlug(slug: $slug) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    location
    contactInfo
    price
    category
    tags
    authorId
    author {
      id
      username
      displayName
      email
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

### Blog Posts

#### Get Blog Posts
```graphql
query GetBlogPosts($limit: Int, $offset: Int, $status: String, $search: String) {
  blogPosts(limit: $limit, offset: $offset, status: $status, search: $search) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    authorId
    author {
      id
      username
      displayName
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

#### Get Single Blog Post
```graphql
query GetBlogPost($id: ID!) {
  blogPost(id: $id) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    authorId
    author {
      id
      username
      displayName
      email
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

### Profiles

#### Get Profiles
```graphql
query GetProfiles($limit: Int, $offset: Int) {
  profiles(limit: $limit, offset: $offset) {
    id
    username
    displayName
    email
    wordpressUserId
    needsPasswordReset
    authUserCreated
    createdAt
    updatedAt
  }
}
```

#### Get Single Profile
```graphql
query GetProfile($id: ID!) {
  profile(id: $id) {
    id
    username
    displayName
    email
    wordpressUserId
    needsPasswordReset
    authUserCreated
    createdAt
    updatedAt
  }
}
```

### Favorites

#### Get User Favorites
```graphql
query GetFavorites($userId: String!) {
  favorites(userId: $userId) {
    id
    userId
    adId
    ad {
      id
      title
      featuredImageUrl
      location
      price
      category
      createdAt
    }
    createdAt
  }
}
```

#### Check if Favorite
```graphql
query IsFavorite($userId: String!, $adId: String!) {
  isFavorite(userId: $userId, adId: $adId)
}
```

## Mutations

### Ad Listings

#### Create Ad Listing
```graphql
mutation CreateAdListing($input: AdListingInput!) {
  createAdListing(input: $input) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    location
    contactInfo
    price
    category
    tags
    authorId
    createdAt
    updatedAt
  }
}
```

#### Update Ad Listing
```graphql
mutation UpdateAdListing($id: ID!, $input: AdListingInput!) {
  updateAdListing(id: $id, input: $input) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    location
    contactInfo
    price
    category
    tags
    authorId
    createdAt
    updatedAt
  }
}
```

#### Delete Ad Listing
```graphql
mutation DeleteAdListing($id: ID!) {
  deleteAdListing(id: $id)
}
```

### Blog Posts

#### Create Blog Post
```graphql
mutation CreateBlogPost($input: BlogPostInput!) {
  createBlogPost(input: $input) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    authorId
    createdAt
    updatedAt
  }
}
```

#### Update Blog Post
```graphql
mutation UpdateBlogPost($id: ID!, $input: BlogPostInput!) {
  updateBlogPost(id: $id, input: $input) {
    id
    title
    content
    excerpt
    status
    featuredImageUrl
    imageUrls
    authorId
    createdAt
    updatedAt
  }
}
```

#### Delete Blog Post
```graphql
mutation DeleteBlogPost($id: ID!) {
  deleteBlogPost(id: $id)
}
```

### Favorites

#### Add Favorite
```graphql
mutation AddFavorite($userId: String!, $adId: String!) {
  addFavorite(userId: $userId, adId: $adId) {
    id
    userId
    adId
    createdAt
  }
}
```

#### Remove Favorite
```graphql
mutation RemoveFavorite($userId: String!, $adId: String!) {
  removeFavorite(userId: $userId, adId: $adId)
}
```

## Input Types

### AdListingInput
```graphql
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
```

### BlogPostInput
```graphql
input BlogPostInput {
  title: String!
  content: String
  excerpt: String
  featuredImageUrl: String
  imageUrls: [String]
}
```

## Usage Examples

### Using Apollo Client

```typescript
import { useQuery } from '@apollo/client'
import { GET_AD_LISTINGS } from '@/lib/graphql-queries'

function AdListingsComponent() {
  const { data, loading, error } = useQuery(GET_AD_LISTINGS, {
    variables: { limit: 10 }
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data.adListings.map(ad => (
        <div key={ad.id}>
          <h3>{ad.title}</h3>
          <p>{ad.excerpt}</p>
        </div>
      ))}
    </div>
  )
}
```

### Using Fetch

```typescript
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      query {
        adListings(limit: 5) {
          id
          title
          excerpt
          location
          price
        }
      }
    `
  })
})

const data = await response.json()
console.log(data.data.adListings)
```

## Testing

Visit `/graphql-playground` to test queries interactively, or use `/graphql-test` to see the API in action with sample data.

## Data Source

This GraphQL API connects directly to your Supabase database containing the migrated WordPress data:
- **Ad Listings:** From WordPress posts with type 'zoekertje'
- **Blog Posts:** From WordPress posts with type 'post'
- **Profiles:** From WordPress users
- **Favorites:** User-ad relationships

All image URLs have been migrated to Supabase Storage and are served from the local Supabase instance.
