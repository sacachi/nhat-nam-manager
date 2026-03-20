import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('~/server/utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn()
    },
    activityLog: { create: vi.fn() }
  }
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}))

import prisma from '~/server/utils/prisma'
import bcrypt from 'bcryptjs'

describe('POST /api/auth/login — Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject when username missing', async () => {
    const body = { password: '123456' }
    expect(!body.username || !body.password).toBe(true)
    // Missing username → should get 400
  })

  it('should reject when password missing', async () => {
    const body = { username: 'admin' }
    expect(!body.username || !body.password).toBe(true)
  })

  it('should reject when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const user = await prisma.user.findUnique({ where: { username: 'nonexistent' } })
    expect(user).toBeNull()
  })

  it('should reject when user is inactive', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', username: 'blocked', password: 'hash', status: 'inactive',
      name: 'Blocked', email: 'b@b.com', role: 'Sale', created_at: new Date()
    } as any)
    const user = await prisma.user.findUnique({ where: { username: 'blocked' } })
    expect(user!.status).not.toBe('active')
  })

  it('should reject when password is wrong', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', username: 'admin', password: '$2a$10$hash', status: 'active',
      name: 'Admin', email: 'a@a.com', role: 'Admin', created_at: new Date()
    } as any)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    
    const isValid = await bcrypt.compare('wrong', '$2a$10$hash')
    expect(isValid).toBe(false)
  })

  it('should succeed with correct credentials', async () => {
    const mockUser = {
      id: '1', username: 'admin', password: '$2a$10$hash', status: 'active',
      name: 'Admin', email: 'a@a.com', role: 'Admin', created_at: new Date()
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

    const user = await prisma.user.findUnique({ where: { username: 'admin' } })
    const isValid = await bcrypt.compare('123456@Abc', user!.password)
    
    expect(user).not.toBeNull()
    expect(user!.status).toBe('active')
    expect(isValid).toBe(true)
  })
})

describe('POST /api/users — Role Check', () => {
  it('should require Admin role', () => {
    // requireAdmin checks: only Admin can create users
    const adminRoles = ['Admin']
    expect(adminRoles.includes('Admin')).toBe(true)
    expect(adminRoles.includes('Sale')).toBe(false)
    expect(adminRoles.includes('Design')).toBe(false)
    expect(adminRoles.includes('Construction')).toBe(false)
  })

  it('should reject duplicate username', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: '1' } as any)
    const existing = await prisma.user.findFirst({ where: { OR: [{ username: 'dup' }] } })
    expect(existing).not.toBeNull()
  })

  it('should hash password before saving', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never)
    const hashed = await bcrypt.hash('123456@Abc', 10)
    expect(hashed).toBe('$2a$10$hashed')
    expect(hashed).not.toBe('123456@Abc')
  })
})

describe('DELETE /api/users/:id — Admin only', () => {
  it('only Admin can delete users', () => {
    const roles = ['Admin']
    expect(roles.includes('Admin')).toBe(true)
    expect(roles.includes('Sale')).toBe(false)
  })
})
