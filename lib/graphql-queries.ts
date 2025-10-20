import { gql } from '@apollo/client'

// Queries
export const GET_AD_LISTINGS = gql`
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
`

export const GET_AD_LISTING = gql`
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
`

export const GET_AD_LISTING_BY_SLUG = gql`
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
`

export const GET_BLOG_POSTS = gql`
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
`

export const GET_BLOG_POST = gql`
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
`

export const GET_BLOG_POST_BY_SLUG = gql`
  query GetBlogPostBySlug($slug: String!) {
    blogPostBySlug(slug: $slug) {
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
`

export const GET_PROFILE = gql`
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
`

export const GET_PROFILE_BY_USERNAME = gql`
  query GetProfileByUsername($username: String!) {
    profileByUsername(username: $username) {
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
`

export const GET_FAVORITES = gql`
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
`

export const IS_FAVORITE = gql`
  query IsFavorite($userId: String!, $adId: String!) {
    isFavorite(userId: $userId, adId: $adId)
  }
`

// Mutations
export const CREATE_AD_LISTING = gql`
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
`

export const UPDATE_AD_LISTING = gql`
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
`

export const DELETE_AD_LISTING = gql`
  mutation DeleteAdListing($id: ID!) {
    deleteAdListing(id: $id)
  }
`

export const CREATE_BLOG_POST = gql`
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
`

export const UPDATE_BLOG_POST = gql`
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
`

export const DELETE_BLOG_POST = gql`
  mutation DeleteBlogPost($id: ID!) {
    deleteBlogPost(id: $id)
  }
`

export const ADD_FAVORITE = gql`
  mutation AddFavorite($userId: String!, $adId: String!) {
    addFavorite(userId: $userId, adId: $adId) {
      id
      userId
      adId
      createdAt
    }
  }
`

export const REMOVE_FAVORITE = gql`
  mutation RemoveFavorite($userId: String!, $adId: String!) {
    removeFavorite(userId: $userId, adId: $adId)
  }
`
