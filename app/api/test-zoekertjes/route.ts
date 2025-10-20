import { NextResponse } from 'next/server'
import { apolloClient } from '@/lib/apollo-client'
import { GET_AD_LISTINGS } from '@/lib/queries'

export async function GET() {
  try {
    const { data } = await apolloClient.query({
      query: GET_AD_LISTINGS,
      variables: { first: 10 },
    })

    return NextResponse.json({
      success: true,
      message: 'Ad Listings fetched successfully!',
      count: (data as any).adListings?.nodes?.length || 0,
      adListings: (data as any).adListings?.nodes || [],
    })
  } catch (error) {
    console.error('WordPress Ad Listings Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      { status: 500 }
    )
  }
}

