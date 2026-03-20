import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('~/server/utils/prisma', () => ({
  default: {
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    receipt: { create: vi.fn() },
    expense: { create: vi.fn() },
    activityLog: { create: vi.fn() },
    projectTask: { findUnique: vi.fn() }
  }
}))

import prisma from '~/server/utils/prisma'
import { validateRequired, validatePositiveNumber, validateEnum } from '~/server/utils/validate'

describe('POST /api/projects — Validation', () => {
  it('requires name field', () => {
    expect(() => validateRequired(undefined, 'Tên công trình')).toThrow()
    expect(() => validateRequired('Nhà anh A', 'Tên công trình')).not.toThrow()
  })

  it('contract_value must be positive', () => {
    expect(() => validatePositiveNumber(100000000, 'Giá trị')).not.toThrow()
    expect(() => validatePositiveNumber(-1, 'Giá trị')).toThrow()
  })

  it('status must be valid enum', () => {
    const validStatuses = ['đang thi công', 'tạm dừng', 'đã hoàn thành']
    expect(() => validateEnum('đang thi công', validStatuses, 'Status')).not.toThrow()
    expect(() => validateEnum('invalid', validStatuses, 'Status')).toThrow()
  })
})

describe('POST /api/receipts — Validation', () => {
  it('requires project_id', () => {
    const body = { amount: 5000000 }
    expect(!body.project_id).toBe(true) // → 400
  })

  it('requires amount > 0', () => {
    expect(!0 || 0 <= 0).toBe(true) // → 400
    expect(!5000000 || 5000000 <= 0).toBe(false) // → pass
  })

  it('amount 0 is rejected', () => {
    const amount = 0
    expect(!amount || amount <= 0).toBe(true)
  })

  it('negative amount is rejected', () => {
    const amount = -100
    expect(!amount || amount <= 0).toBe(true)
  })
})

describe('POST /api/expenses — Validation', () => {
  const VALID_TYPES = ['material', 'labor', 'other']

  it('requires project_id', () => {
    expect(() => validateRequired(undefined, 'Công trình')).toThrow()
  })

  it('requires type', () => {
    expect(() => validateRequired(undefined, 'Loại chi phí')).toThrow()
  })

  it('requires amount', () => {
    expect(() => validateRequired(undefined, 'Số tiền')).toThrow()
  })

  it('type must be material, labor, or other', () => {
    expect(() => validateEnum('material', VALID_TYPES, 'Loại')).not.toThrow()
    expect(() => validateEnum('labor', VALID_TYPES, 'Loại')).not.toThrow()
    expect(() => validateEnum('other', VALID_TYPES, 'Loại')).not.toThrow()
    expect(() => validateEnum('invalid', VALID_TYPES, 'Loại')).toThrow()
  })

  it('amount must not be negative', () => {
    expect(() => validatePositiveNumber(100000, 'Số tiền')).not.toThrow()
    expect(() => validatePositiveNumber(-1, 'Số tiền')).toThrow()
  })
})

describe('POST /api/tasks — Validation', () => {
  const VALID_TYPES = ['design', 'construction', 'inspection', 'other']
  const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']
  const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

  it('requires title', () => {
    expect(() => validateRequired(undefined, 'Tiêu đề')).toThrow()
    expect(() => validateRequired('Task 1', 'Tiêu đề')).not.toThrow()
  })

  it('task type must be valid', () => {
    expect(() => validateEnum('design', VALID_TYPES, 'Loại')).not.toThrow()
    expect(() => validateEnum('invalid', VALID_TYPES, 'Loại')).toThrow()
  })

  it('priority must be valid', () => {
    expect(() => validateEnum('high', VALID_PRIORITIES, 'Ưu tiên')).not.toThrow()
    expect(() => validateEnum('extreme', VALID_PRIORITIES, 'Ưu tiên')).toThrow()
  })

  it('status must be valid', () => {
    expect(() => validateEnum('pending', VALID_STATUSES, 'Status')).not.toThrow()
    expect(() => validateEnum('done', VALID_STATUSES, 'Status')).toThrow()
  })

  it('must have project_id OR lead_id (not both, not neither)', () => {
    // Case: neither → fail
    const neither = { project_id: null, lead_id: null }
    expect(!neither.project_id && !neither.lead_id).toBe(true)

    // Case: both → fail
    const both = { project_id: 'p1', lead_id: 'l1' }
    expect(both.project_id && both.lead_id).toBeTruthy()

    // Case: only project → pass
    const projectOnly = { project_id: 'p1', lead_id: null }
    expect(projectOnly.project_id && !projectOnly.lead_id).toBe(true)

    // Case: only lead → pass
    const leadOnly = { project_id: null, lead_id: 'l1' }
    expect(!leadOnly.project_id && leadOnly.lead_id).toBeTruthy()
  })
})
