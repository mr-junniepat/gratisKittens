import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const httpLink = new HttpLink({
  uri: '/api/graphql',
})

// Auth link to add authorization header
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
  },
})

