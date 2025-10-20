import { NextResponse } from 'next/server'
import { apolloClient } from '@/lib/apollo-client'
import { gql } from '@apollo/client'

// Check what WordPress information is exposed
const CHECK_WP_INFO = gql`
  query CheckWordPressInfo {
    generalSettings {
      title
      description
      url
      language
      dateFormat
      timeFormat
    }
  }
`

// Try to get plugins (this usually requires custom GraphQL registration)
const CHECK_PLUGINS = gql`
  query CheckPlugins {
    plugins {
      nodes {
        name
        version
        author
      }
    }
  }
`

// Try to get theme info
const CHECK_THEME = gql`
  query CheckTheme {
    theme {
      name
      version
      author
    }
  }
`

// Check if WordPress version is exposed
const CHECK_VERSION = gql`
  query CheckVersion {
    __type(name: "GeneralSettings") {
      fields {
        name
      }
    }
  }
`

export async function GET() {
  const results: any = {
    success: true,
    exposedInfo: {},
    security: {
      concerns: [],
      recommendations: []
    }
  }

  // Test 1: General Settings (usually exposed)
  try {
    const { data } = await apolloClient.query({
      query: CHECK_WP_INFO,
    })
    results.exposedInfo.generalSettings = data.generalSettings
    results.security.concerns.push('✓ General settings exposed (normal)')
  } catch (error) {
    results.exposedInfo.generalSettings = 'Not exposed'
  }

  // Test 2: Plugins (usually NOT exposed by default)
  try {
    const { data } = await apolloClient.query({
      query: CHECK_PLUGINS,
    })
    if (data.plugins) {
      results.exposedInfo.plugins = data.plugins.nodes
      results.security.concerns.push('⚠️ PLUGINS ARE EXPOSED - Security Risk!')
      results.security.recommendations.push('Hide plugin information from GraphQL')
    }
  } catch (error) {
    results.exposedInfo.plugins = 'Not exposed (Good!)'
    results.security.concerns.push('✓ Plugins hidden (good security)')
  }

  // Test 3: Theme info
  try {
    const { data } = await apolloClient.query({
      query: CHECK_THEME,
    })
    if (data.theme) {
      results.exposedInfo.theme = data.theme
      results.security.concerns.push('⚠️ Theme info exposed')
      results.security.recommendations.push('Hide theme information')
    }
  } catch (error) {
    results.exposedInfo.theme = 'Not exposed (Good!)'
  }

  // Test 4: Check available fields
  try {
    const { data } = await apolloClient.query({
      query: CHECK_VERSION,
    })
    results.exposedInfo.availableFields = data.__type?.fields?.map((f: any) => f.name) || []
  } catch (error) {
    results.exposedInfo.availableFields = 'Introspection disabled (Good!)'
  }

  // Add overall security assessment
  const criticalIssues = results.security.concerns.filter((c: string) => c.includes('⚠️')).length
  
  results.security.overallStatus = criticalIssues === 0 
    ? '✅ SECURE - No critical issues found' 
    : `⚠️ ${criticalIssues} security issue(s) found`

  // Add recommendations
  if (!results.security.recommendations.length) {
    results.security.recommendations.push('Your GraphQL is properly secured!')
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}

