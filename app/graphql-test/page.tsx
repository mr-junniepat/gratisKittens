'use client'

import { useQuery } from '@apollo/client'
import { GET_AD_LISTINGS, GET_BLOG_POSTS } from '@/lib/graphql-queries'

export default function GraphQLTestPage() {
  const { data: adData, loading: adLoading, error: adError } = useQuery(GET_AD_LISTINGS, {
    variables: { limit: 5 }
  })

  const { data: blogData, loading: blogLoading, error: blogError } = useQuery(GET_BLOG_POSTS, {
    variables: { limit: 5 }
  })

  if (adLoading || blogLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">GraphQL Test Page</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (adError || blogError) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">GraphQL Test Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {adError?.message || blogError?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">GraphQL Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ad Listings */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Ad Listings ({adData?.adListings?.length || 0})</h2>
          <div className="space-y-4">
            {adData?.adListings?.map((ad: any) => (
              <div key={ad.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{ad.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{ad.excerpt}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {ad.location && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">📍 {ad.location}</span>}
                  {ad.category && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">🏷️ {ad.category}</span>}
                  {ad.price && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">💰 {ad.price}</span>}
                </div>
                {ad.featuredImageUrl && (
                  <img 
                    src={ad.featuredImageUrl} 
                    alt={ad.title}
                    className="w-full h-32 object-cover rounded mt-2"
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  By {ad.author?.displayName || ad.author?.username} • {new Date(ad.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Blog Posts */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Blog Posts ({blogData?.blogPosts?.length || 0})</h2>
          <div className="space-y-4">
            {blogData?.blogPosts?.map((post: any) => (
              <div key={post.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{post.excerpt}</p>
                {post.featuredImageUrl && (
                  <img 
                    src={post.featuredImageUrl} 
                    alt={post.title}
                    className="w-full h-32 object-cover rounded mt-2"
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  By {post.author?.displayName || post.author?.username} • {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GraphQL Playground Link */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">GraphQL Playground</h3>
        <p className="text-sm text-gray-600 mb-2">
          You can test GraphQL queries directly at: <code className="bg-white px-2 py-1 rounded">/api/graphql</code>
        </p>
        <p className="text-sm text-gray-600">
          Try this query to get ad listings:
        </p>
        <pre className="bg-white p-3 rounded mt-2 text-xs overflow-x-auto">
{`query {
  adListings(limit: 5) {
    id
    title
    excerpt
    location
    category
    price
    featuredImageUrl
    author {
      username
      displayName
    }
  }
}`}
        </pre>
      </div>
    </div>
  )
}
