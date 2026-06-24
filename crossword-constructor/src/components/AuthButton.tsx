import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { AuthProvider } from '@/lib/auth'

const providerLabels: Record<AuthProvider, string> = {
  github: 'GitHub',
  google: 'Google',
}

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const { session, providers, loading, error, signInWith, signOutUser } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (loading) {
    return <span className="text-xs text-app-subtle">Auth…</span>
  }

  if (providers.length === 0) {
    return null
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOutUser()
    } catch {
      setSigningOut(false)
    }
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className={`rounded-full bg-[#dcfce7] text-app-green ${compact ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-sm'}`}>
          Signed in
        </span>
        <button
          type="button"
          className={`app-btn-ghost ${compact ? 'text-xs' : 'text-sm'}`}
          disabled={signingOut}
          onClick={() => void handleSignOut()}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={`rounded border border-app-border bg-app-surface text-app-muted hover:bg-app-warm ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'}`}
        onClick={() => setMenuOpen((open) => !open)}
      >
        Sign in
      </button>
      {menuOpen && (
        <div className="absolute right-0 z-20 mt-1 min-w-36 rounded-md border border-app-border bg-app-surface py-1 shadow-lg">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-app-muted hover:bg-app-warm"
              onClick={() => signInWith(provider)}
            >
              Continue with {providerLabels[provider]}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
