import type { ExpressAuthConfig } from '@auth/express'
import type { Provider } from '@auth/core/providers'
import GitHub from '@auth/express/providers/github'
import Google from '@auth/express/providers/google'
import { toOpaqueUserId } from './opaqueUserId.js'

function authSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters')
  }
  return secret
}

function configuredProviders(): Provider[] {
  const providers: Provider[] = []

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
        profile() {
          return { id: 'redacted' }
        },
      }),
    )
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        profile() {
          return { id: 'redacted' }
        },
      }),
    )
  }

  return providers
}

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: configuredProviders(),
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider && account.providerAccountId) {
        token.sub = toOpaqueUserId(authSecret(), account.provider, account.providerAccountId)
      }

      delete token.email
      delete token.name
      delete token.picture
      return token
    },
    session({ session, token }) {
      session.user = { id: token.sub ?? '' }
      return session
    },
  },
} satisfies ExpressAuthConfig
