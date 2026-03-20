import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '~/server/utils/jwt'

describe('signToken', () => {
  it('returns a JWT string', () => {
    const token = signToken({ id: 'user-1', role: 'Admin' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // header.payload.signature
  })

  it('token contains payload data', () => {
    const payload = { id: 'user-1', role: 'Admin', username: 'admin' }
    const token = signToken(payload)
    const decoded = verifyToken(token) as any
    expect(decoded).not.toBeNull()
    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe('Admin')
    expect(decoded.username).toBe('admin')
  })
})

describe('verifyToken', () => {
  it('verifies a valid token', () => {
    const token = signToken({ id: 'user-1', role: 'Sale' })
    const decoded = verifyToken(token) as any
    expect(decoded).not.toBeNull()
    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe('Sale')
  })

  it('returns null for fake token', () => {
    expect(verifyToken('fake.jwt.token')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(verifyToken('')).toBeNull()
  })

  it('returns null for random string', () => {
    expect(verifyToken('not-a-jwt-at-all')).toBeNull()
  })

  it('token includes exp claim', () => {
    const token = signToken({ id: 'user-1' })
    const decoded = verifyToken(token) as any
    expect(decoded.exp).toBeDefined()
    expect(decoded.iat).toBeDefined()
  })
})
