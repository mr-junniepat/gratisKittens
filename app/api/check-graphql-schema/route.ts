import { NextResponse } from 'next/server'
import { apolloClient } from '@/lib/apollo-client'
import { gql } from '@apollo/client'

const INTROSPECTION_QUERY = gql`
  query IntrospectionQuery {
    __schema {
      queryType {
        name
      }
      types {
        name
        kind
        description
      }
    }
  }
`

const CHECK_POST_TYPES = gql`
  query CheckPostTypes {
    contentTypes {
      nodes {
        name
        label
        graphqlSingleName
        graphqlPluralName
        description
        public
      }
    }
  }
`

export async function GET() {
  try {
    // Get all post types
    const { data: postTypesData } = await apolloClient.query({
      query: CHECK_POST_TYPES,
    })

    // Try to get schema info (may be disabled in production)
    let schemaInfo = null
    try {
      const { data: schemaData } = await apolloClient.query({
        query: INTROSPECTION_QUERY,
      })
      schemaInfo = schemaData
    } catch (error) {
      schemaInfo = { error: 'Introspection is disabled (good for security!)' }
    }

    return NextResponse.json({
      success: true,
      message: 'GraphQL schema check completed',
      postTypes: postTypesData.contentTypes?.nodes || [],
      schemaInfo,
      security: {
        introspectionEnabled: schemaInfo && !schemaInfo.error,
        recommendation: schemaInfo && !schemaInfo.error 
          ? 'DISABLE introspection in production!' 
          : 'Good - introspection is disabled',
      }
    })
  } catch (error) {
    console.error('GraphQL Schema Check Error:', error)
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

