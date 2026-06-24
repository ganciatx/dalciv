import { useCallback, useEffect, useState } from 'react'
import type { AuthProvider, AuthSession } from '@/lib/auth'
import { fetchConfiguredProviders, fetchSession, signIn, signOut } from '@/lib/auth'

interface AuthState {
  session: AuthSession | null
  providers: AuthProvider[]
  loading: boolean
  error: string | null
  signInWith: (provider: AuthProvider) => void
  signOutUser: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [providers, setProviders] = useState<AuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextSession, nextProviders] = await Promise.all([fetchSession(), fetchConfiguredProviders()])
      setSession(nextSession)
      setProviders(nextProviders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auth state')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signInWith = useCallback((provider: AuthProvider) => {
    signIn(provider)
  }, [])

  const signOutUser = useCallback(async () => {
    await signOut()
    setSession(null)
  }, [])

  return { session, providers, loading, error, signInWith, signOutUser, refresh }
}
