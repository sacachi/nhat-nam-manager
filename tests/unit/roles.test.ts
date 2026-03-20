import { describe, it, expect, vi } from 'vitest'
import { 
  ADMIN_ROLES, SALE_ROLES, DESIGN_ROLES, THI_CONG_ROLES, ALL_ROLES,
  maskPhone, canViewFullPhone, requireRole 
} from '~/server/utils/roles'

describe('Role Constants', () => {
  it('ADMIN_ROLES contains only Admin', () => {
    expect(ADMIN_ROLES).toEqual(['Admin'])
  })

  it('SALE_ROLES contains Admin and Sale', () => {
    expect(SALE_ROLES).toEqual(['Admin', 'Sale'])
  })

  it('DESIGN_ROLES contains Admin and Design', () => {
    expect(DESIGN_ROLES).toEqual(['Admin', 'Design'])
  })

  it('THI_CONG_ROLES contains Admin and Construction', () => {
    expect(THI_CONG_ROLES).toEqual(['Admin', 'Construction'])
  })

  it('ALL_ROLES contains all 4 roles', () => {
    expect(ALL_ROLES).toEqual(['Admin', 'Sale', 'Design', 'Construction'])
    expect(ALL_ROLES).toHaveLength(4)
  })
})

describe('maskPhone', () => {
  const phone = '0901234567'

  it('Admin sees full phone number', () => {
    expect(maskPhone(phone, 'Admin')).toBe(phone)
  })

  it('Sale sees full phone number', () => {
    expect(maskPhone(phone, 'Sale')).toBe(phone)
  })

  it('Design sees masked phone', () => {
    expect(maskPhone(phone, 'Design')).toBe('**********')
  })

  it('Construction sees masked phone', () => {
    expect(maskPhone(phone, 'Construction')).toBe('**********')
  })

  it('returns null for null input', () => {
    expect(maskPhone(null, 'Admin')).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(maskPhone(undefined, 'Admin')).toBeNull()
  })

  it('mask length matches phone length', () => {
    const result = maskPhone('012345678', 'Design')
    expect(result).toBe('*********')
    expect(result!.length).toBe(9)
  })
})

describe('canViewFullPhone', () => {
  it('Admin can view full phone', () => {
    expect(canViewFullPhone('Admin')).toBe(true)
  })

  it('Sale can view full phone', () => {
    expect(canViewFullPhone('Sale')).toBe(true)
  })

  it('Design cannot view full phone', () => {
    expect(canViewFullPhone('Design')).toBe(false)
  })

  it('Construction cannot view full phone', () => {
    expect(canViewFullPhone('Construction')).toBe(false)
  })
})

describe('requireRole', () => {
  const makeEvent = (role: string) => ({
    context: { user: { id: '1', role, username: 'test', name: 'Test' } }
  }) as any

  it('returns user when role is allowed', () => {
    const event = makeEvent('Admin')
    const user = requireRole(event, ['Admin'])
    expect(user.role).toBe('Admin')
  })

  it('returns user for Sale in SALE_ROLES', () => {
    const event = makeEvent('Sale')
    const user = requireRole(event, ['Admin', 'Sale'])
    expect(user.role).toBe('Sale')
  })

  it('throws 403 when role is not allowed', () => {
    const event = makeEvent('Sale')
    expect(() => requireRole(event, ['Admin'])).toThrow()
    try {
      requireRole(event, ['Admin'])
    } catch (e: any) {
      expect(e.statusCode).toBe(403)
    }
  })

  it('throws 403 for Design accessing Admin route', () => {
    const event = makeEvent('Design')
    expect(() => requireRole(event, ['Admin'])).toThrow()
  })

  it('throws 403 for Construction accessing Sale route', () => {
    const event = makeEvent('Construction')
    expect(() => requireRole(event, ['Admin', 'Sale'])).toThrow()
  })
})
