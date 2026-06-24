import { describe, expect, it } from 'vitest'
import { toOpaqueUserId } from './opaqueUserId'

const SECRET = 'a'.repeat(32)

describe('toOpaqueUserId', () => {
  it('returns a stable 32-char hex id', () => {
    const id = toOpaqueUserId(SECRET, 'github', '12345')
    expect(id).toHaveLength(32)
    expect(id).toMatch(/^[0-9a-f]+$/)
    expect(toOpaqueUserId(SECRET, 'github', '12345')).toBe(id)
  })

  it('differs across providers and accounts', () => {
    const github = toOpaqueUserId(SECRET, 'github', '12345')
    const google = toOpaqueUserId(SECRET, 'google', '12345')
    const other = toOpaqueUserId(SECRET, 'github', '67890')
    expect(github).not.toBe(google)
    expect(github).not.toBe(other)
  })
})
