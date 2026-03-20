import { H3Event } from 'h3'
import { getAuthUser } from './auth'

export const ADMIN_ROLES = ['Admin'] as const
export const SALE_ROLES = ['Admin', 'Sale'] as const
export const DESIGN_ROLES = ['Admin', 'Design'] as const
export const THI_CONG_ROLES = ['Admin', 'Construction'] as const
export const ALL_ROLES = ['Admin', 'Sale', 'Design', 'Construction'] as const

export type Role = 'Admin' | 'Sale' | 'Design' | 'Construction'

export const requireRole = (event: H3Event, allowedRoles: readonly string[]): ReturnType<typeof getAuthUser> => {
  const user = getAuthUser(event)
  if (!allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền truy cập' })
  }
  return user
}

export const requireAdmin = (event: H3Event) => requireRole(event, ADMIN_ROLES)

export const requireSaleOrAdmin = (event: H3Event) => requireRole(event, SALE_ROLES)

export const maskPhone = (phone: string | null | undefined, role: string): string | null => {
  if (!phone) return null
  if (['Admin', 'Sale'].includes(role)) return phone
  return '*'.repeat(phone.length)
}

export const canViewFullPhone = (role: string): boolean => {
  return ['Admin', 'Sale'].includes(role)
}
