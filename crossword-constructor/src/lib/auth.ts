export interface AuthSession {
  userId: string
}

export type AuthProvider = 'github' | 'google'

interface SessionResponse {
  user?: { id?: string }
}

const AUTH_BASE = '/auth'

export async function fetchSession(): Promise<AuthSession | null> {
  const response = await fetch(`${AUTH_BASE}/session`, { credentials: 'include' })
  if (!response.ok) return null

  const data = (await response.json()) as SessionResponse | null
  const userId = data?.user?.id
  if (!userId) return null

  return { userId }
}

export async function fetchConfiguredProviders(): Promise<AuthProvider[]> {
  const response = await fetch(`${AUTH_BASE}/providers`, { credentials: 'include' })
  if (!response.ok) return []

  const data = (await response.json()) as Record<string, unknown>
  return Object.keys(data).filter((id): id is AuthProvider => id === 'github' || id === 'google')
}

export function signIn(provider: AuthProvider): void {
  window.location.assign(`${AUTH_BASE}/signin/${provider}`)
}

export async function signOut(): Promise<void> {
  const csrfResponse = await fetch(`${AUTH_BASE}/csrf`, { credentials: 'include' })
  if (!csrfResponse.ok) throw new Error('Failed to load sign-out token')

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string }
  const body = new URLSearchParams({ csrfToken, callbackUrl: window.location.origin })

  const response = await fetch(`${AUTH_BASE}/signout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include',
  })

  if (!response.ok) throw new Error('Sign out failed')
  window.location.assign(window.location.pathname)
}
