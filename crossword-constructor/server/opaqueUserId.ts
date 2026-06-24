import { createHmac } from 'node:crypto'

/** Derive a stable, non-reversible user id from provider credentials. */
export function toOpaqueUserId(secret: string, provider: string, providerAccountId: string): string {
  if (secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters')
  }

  return createHmac('sha256', secret)
    .update(`${provider}:${providerAccountId}`)
    .digest('hex')
    .slice(0, 32)
}
