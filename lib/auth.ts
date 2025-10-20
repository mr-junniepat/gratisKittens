import { apolloClient } from './apollo-client'
import { LOGIN_MUTATION, REGISTER_MUTATION } from './queries'

export interface User {
  id: string
  name: string
  email: string
  username: string
}

export interface AuthResponse {
  authToken?: string
  user?: User
  error?: string
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: { username, password }
    })
    
    if (data.login.authToken) {
      // Store token in localStorage
      localStorage.setItem('authToken', data.login.authToken)
      return {
        authToken: data.login.authToken,
        user: data.login.user
      }
    }
    
    return { error: 'Login failed' }
  } catch (error) {
    return { error: 'Invalid credentials' }
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER_MUTATION,
      variables: { username, email, password }
    })
    
    return {
      user: data.registerUser.user
    }
  } catch (error) {
    return { error: 'Registration failed' }
  }
}

export function logoutUser() {
  localStorage.removeItem('authToken')
  // Redirect to home page
  window.location.href = '/'
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken')
  }
  return null
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
