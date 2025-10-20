import { gql } from '@apollo/client'

// Query to get all posts (can be used for blog, kittens, etc.)
export const GET_POSTS = gql`
  query GetPosts($first: Int = 10) {
    posts(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        author {
          node {
            name
          }
        }
      }
    }
  }
`

// Query to get a single post by slug
export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      id
      title
      content
      date
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      author {
        node {
          name
        }
      }
    }
  }
`

// Query to get all pages
export const GET_PAGES = gql`
  query GetPages {
    pages(first: 100) {
      nodes {
        id
        title
        slug
        content
      }
    }
  }
`

// Query to get site settings
export const GET_SITE_SETTINGS = gql`
  query GetSiteSettings {
    generalSettings {
      title
      description
      url
    }
  }
`

// Query for Ad Listings (Kitten Classifieds) - Complete with all fields
export const GET_AD_LISTINGS = gql`
  query GetAdListings($first: Int = 20) {
    adListings(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        title
        slug
        excerpt
        content
        date
        featuredImageUrl
        attachments
        # Advertisement Info Fields
        referenceId
        todayViews
        totalViews
        postedFromIp
        markedAsSold
        # Advertisement Details Fields
        isSought
        numberOfKittens
        toiletTrained
        dateOfBirth
        canBePickedUpFrom
        postalCode
        city
        province
        country
        # Price Information Fields
        adDuration
        expiresOn
        totalAdCost
        # Legacy Fields
        kittenAge
        kittenBreed
        kittenGender
        location
        price
        contactPhone
        contactEmail
        vaccinated
        chipped
        # Debug Field
        customFields
        author {
          node {
            name
          }
        }
      }
    }
  }
`

// Query for Ad Listings with all custom fields (use after plugin update)
export const GET_AD_LISTINGS_FULL = gql`
  query GetAdListingsFull($first: Int = 20) {
    adListings(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        kittenAge
        kittenBreed
        kittenGender
        location
        price
        contactPhone
        contactEmail
        vaccinated
        chipped
        customFields
        author {
          node {
            name
          }
        }
      }
    }
  }
`

// Query for a single ad listing - Complete with all fields
export const GET_AD_LISTING_BY_SLUG = gql`
  query GetAdListingBySlug($slug: String!) {
    adListingBy(slug: $slug) {
      id
      title
      content
      date
      excerpt
      featuredImageUrl
      attachments
      # Advertisement Info Fields
      referenceId
      todayViews
      totalViews
      postedFromIp
      markedAsSold
      # Advertisement Details Fields
      isSought
      numberOfKittens
      toiletTrained
      dateOfBirth
      canBePickedUpFrom
      postalCode
      city
      province
      country
      # Price Information Fields
      adDuration
      expiresOn
      totalAdCost
      # Legacy Fields
      kittenAge
      kittenBreed
      kittenGender
      location
      price
      contactPhone
      contactEmail
      vaccinated
      chipped
      # Debug Field
      customFields
      author {
        node {
          name
        }
      }
    }
  }
`

// Query for a single ad listing with all custom fields (use after plugin update)
export const GET_AD_LISTING_BY_SLUG_FULL = gql`
  query GetAdListingBySlugFull($slug: String!) {
    adListingBy(slug: $slug) {
      id
      title
      content
      date
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      kittenAge
      kittenBreed
      kittenGender
      location
      price
      contactPhone
      contactEmail
      vaccinated
      chipped
      customFields
      author {
        node {
          name
        }
      }
    }
  }
`

// Authentication mutations
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: {
      username: $username
      password: $password
    }) {
      authToken
      user {
        id
        name
        email
        username
      }
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    registerUser(input: {
      username: $username
      email: $email
      password: $password
    }) {
      user {
        id
        name
        email
        username
      }
    }
  }
`

// User's ad listings query
export const GET_USER_ADS = gql`
  query GetUserAds($authorId: ID!) {
    adListings(where: { author: $authorId }) {
      nodes {
        id
        title
        date
        status
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }
  }
`

// Query for featured kittens (most viewed daily) - Full version with all custom fields
export const GET_FEATURED_KITTENS = gql`
  query GetFeaturedKittens($first: Int = 6) {
    adListings(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        kittenAge
        kittenBreed
        kittenGender
        location
        price
        contactPhone
        contactEmail
        vaccinated
        chipped
        customFields
        author {
          node {
            name
          }
        }
      }
    }
  }
`

// Query for featured kittens with all custom fields (use after plugin update)
export const GET_FEATURED_KITTENS_FULL = gql`
  query GetFeaturedKittensFull($first: Int = 6) {
    adListings(first: $first, where: { orderby: { field: META_VALUE_NUM, metaKey: "daily_views", order: DESC } }) {
      nodes {
        id
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        kittenAge
        kittenBreed
        kittenGender
        location
        price
        contactPhone
        contactEmail
        vaccinated
        chipped
        customFields
        author {
          node {
            name
          }
        }
      }
    }
  }
`

// Legacy export for backwards compatibility
export const GET_ZOEKERTJES = GET_AD_LISTINGS
export const GET_ZOEKERTJE_BY_SLUG = GET_AD_LISTING_BY_SLUG

