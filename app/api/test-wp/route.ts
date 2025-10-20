import { NextResponse } from 'next/server'
import { apolloClient } from '@/lib/apollo-client'
import { GET_POSTS, GET_SITE_SETTINGS } from '@/lib/queries'

export async function GET() {
  try {
    // Test getting site settings
    const { data: settingsData } = await apolloClient.query({
      query: GET_SITE_SETTINGS,
    })

    // Test getting posts
    const { data: postsData } = await apolloClient.query({
      query: GET_POSTS,
      variables: { first: 5 },
    })

    return NextResponse.json({
      success: true,
      message: 'WordPress GraphQL API connected successfully!',
      siteSettings: settingsData.generalSettings,
      postsCount: postsData.posts.nodes.length,
      posts: postsData.posts.nodes,
    })
  } catch (error) {
    console.error('WordPress API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

