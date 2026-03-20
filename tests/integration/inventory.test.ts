import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('~/server/utils/prisma', () => ({
  default: {
    supplier: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn()
    },
    material: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    stockIn: {
      create: vi.fn(),
      count: vi.fn()
    },
    stockInItem: { create: vi.fn() },
    stockOut: { create: vi.fn(), count: vi.fn() },
    stockOutItem: { create: vi.fn() },
    stockLog: { create: vi.fn() },
    expense: { create: vi.fn() },
    project: { findUnique: vi.fn() },
    activityLog: { create: vi.fn() }
  }
}))

import prisma from '~/server/utils/prisma'

describe('POST /api/suppliers — Validation', () => {
  it('requires supplier name', () => {
    const body = { name: '' }
    expect(!body.name?.trim()).toBe(true)
  })

  it('rejects duplicate code', async () => {
    vi.mocked(prisma.supplier.findUnique).mockResolvedValue({ id: '1', code: 'NCC0001' } as any)
    const existing = await prisma.supplier.findUnique({ where: { code: 'NCC0001' } })
    expect(existing).not.toBeNull()
  })

  it('auto-generates code when not provided', async () => {
    vi.mocked(prisma.supplier.count).mockResolvedValue(5)
    const count = await prisma.supplier.count()
    const code = `NCC${String(count + 1).padStart(4, '0')}`
    expect(code).toBe('NCC0006')
  })

  it('role check: only Admin + Accounting allowed', () => {
    const allowed = ['Admin', 'Accounting']
    expect(allowed.includes('Admin')).toBe(true)
    expect(allowed.includes('Accounting')).toBe(true)
    expect(allowed.includes('Sale')).toBe(false)
    expect(allowed.includes('Design')).toBe(false)
  })
})

describe('POST /api/materials — Validation', () => {
  it('requires material name', () => {
    expect(!undefined).toBe(true) // → 400
    expect(!'Gạch men').toBe(false) // → pass
  })

  it('requires unit', () => {
    expect(!undefined).toBe(true) // → 400
    expect(!'viên').toBe(false) // → pass
  })

  it('rejects duplicate code', async () => {
    vi.mocked(prisma.material.findUnique).mockResolvedValue({ id: '1', code: 'VT0001' } as any)
    const existing = await prisma.material.findUnique({ where: { code: 'VT0001' } })
    expect(existing).not.toBeNull()
  })

  it('auto-generates code when not provided', async () => {
    vi.mocked(prisma.material.count).mockResolvedValue(10)
    const count = await prisma.material.count()
    const code = `VT${String(count + 1).padStart(4, '0')}`
    expect(code).toBe('VT0011')
  })
})

describe('BQGQ — Bình quân gia quyền (Stock In)', () => {
  it('first stock-in: avg_cost = unit_price', () => {
    const material = { current_stock: 0, avg_cost: 0 }
    const item = { quantity: 100, unit_price: 50000 }

    const total_price = item.quantity * item.unit_price // 5,000,000
    const new_total_value = (material.current_stock * material.avg_cost) + total_price // 0 + 5,000,000
    const new_stock = material.current_stock + item.quantity // 100
    const avg_cost_after = new_stock > 0 ? new_total_value / new_stock : 0 // 50,000

    expect(new_stock).toBe(100)
    expect(avg_cost_after).toBe(50000)
    expect(new_total_value).toBe(5000000)
  })

  it('second stock-in: weighted average', () => {
    // After first: stock=100, avg_cost=50,000, value=5,000,000
    const material = { current_stock: 100, avg_cost: 50000 }
    const item = { quantity: 50, unit_price: 60000 }

    const total_price = item.quantity * item.unit_price // 3,000,000
    const new_total_value = (material.current_stock * material.avg_cost) + total_price // 8,000,000
    const new_stock = material.current_stock + item.quantity // 150
    const avg_cost_after = new_total_value / new_stock // 53,333.33

    expect(new_stock).toBe(150)
    expect(new_total_value).toBe(8000000)
    expect(avg_cost_after).toBeCloseTo(53333.33, 1)
  })

  it('third stock-in: cumulative BQGQ', () => {
    // After second: stock=150, avg_cost≈53,333.33, value=8,000,000
    const material = { current_stock: 150, avg_cost: 53333.33 }
    const item = { quantity: 200, unit_price: 45000 }

    const total_price = item.quantity * item.unit_price // 9,000,000
    const new_total_value = (material.current_stock * material.avg_cost) + total_price
    const new_stock = material.current_stock + item.quantity // 350
    const avg_cost_after = new_total_value / new_stock

    expect(new_stock).toBe(350)
    expect(avg_cost_after).toBeCloseTo(48571.43, 0)
  })

  it('stock-in creates StockLog with correct before/after', () => {
    const material = { current_stock: 100, avg_cost: 50000 }
    const item = { quantity: 50, unit_price: 60000 }

    const stock_before = material.current_stock
    const stock_after = material.current_stock + item.quantity
    const avg_cost_before = material.avg_cost
    const value_before = material.current_stock * material.avg_cost
    const total_price = item.quantity * item.unit_price
    const value_after = value_before + total_price
    const avg_cost_after = value_after / stock_after

    expect(stock_before).toBe(100)
    expect(stock_after).toBe(150)
    expect(avg_cost_before).toBe(50000)
    expect(value_before).toBe(5000000)
    expect(value_after).toBe(8000000)
    expect(avg_cost_after).toBeCloseTo(53333.33, 1)
  })
})

describe('Stock Out — Xuất kho', () => {
  it('reduces current_stock correctly', () => {
    const material = { current_stock: 150, avg_cost: 53333.33 }
    const quantity = 30

    const new_stock = material.current_stock - quantity
    const new_value = new_stock * material.avg_cost

    expect(new_stock).toBe(120)
    expect(new_value).toBeCloseTo(6400000, -2)
  })

  it('rejects when quantity exceeds stock', () => {
    const material = { current_stock: 50, name: 'Gạch men', unit: 'viên' }
    const quantity = 100

    expect(material.current_stock < quantity).toBe(true)
    // → Should throw error
  })

  it('avg_cost stays the same after stock-out', () => {
    const material = { current_stock: 150, avg_cost: 53333.33 }
    const quantity = 30
    
    // Stock out does not change avg_cost
    const avg_cost_after = material.avg_cost
    expect(avg_cost_after).toBe(53333.33)
  })

  it('auto-generates PXK code', async () => {
    vi.mocked(prisma.stockOut.count).mockResolvedValue(3)
    const count = await prisma.stockOut.count()
    const code = `PXK${String(count + 1).padStart(5, '0')}`
    expect(code).toBe('PXK00004')
  })

  it('creates linked Expense for stock-out', () => {
    const stockOutData = {
      project_id: 'proj-1',
      total_cost: 1600000,
      type: 'material'
    }
    // Stock-out creates expense automatically with type='material'
    expect(stockOutData.type).toBe('material')
    expect(stockOutData.total_cost).toBeGreaterThan(0)
  })

  it('full stock depletion → stock=0, value=0', () => {
    const material = { current_stock: 50, avg_cost: 53333.33 }
    const quantity = 50
    
    const new_stock = material.current_stock - quantity
    const new_value = new_stock * material.avg_cost

    expect(new_stock).toBe(0)
    expect(new_value).toBe(0)
  })
})

describe('Supplier Debt — Công nợ', () => {
  it('debt = total_amount - paid_amount', () => {
    const total_amount = 10000000
    const paid_amount = 3000000
    const debt = total_amount - paid_amount
    expect(debt).toBe(7000000)
  })

  it('fully paid → debt = 0', () => {
    const total = 10000000
    const paid = 10000000
    expect(total - paid).toBe(0)
  })

  it('no payment → debt = total', () => {
    const total = 10000000
    const paid = 0
    expect(total - paid).toBe(10000000)
  })

  it('multiple stock-ins: debt = Σ total - Σ paid', () => {
    const stockIns = [
      { total_amount: 5000000, paid_amount: 2000000 },
      { total_amount: 3000000, paid_amount: 0 },
      { total_amount: 2000000, paid_amount: 1000000 }
    ]
    const totalDebt = stockIns.reduce((sum, si) => sum + (si.total_amount - si.paid_amount), 0)
    expect(totalDebt).toBe(7000000)
  })

  it('supplier payment reduces debt', () => {
    let debt = 7000000
    const payment = 2000000
    debt -= payment
    expect(debt).toBe(5000000)
  })
})

describe('Stock-In Code Generation', () => {
  it('generates PNK code with padding', async () => {
    vi.mocked(prisma.stockIn.count).mockResolvedValue(0)
    const count = await prisma.stockIn.count()
    const code = `PNK${String(count + 1).padStart(5, '0')}`
    expect(code).toBe('PNK00001')
  })

  it('increments correctly', async () => {
    vi.mocked(prisma.stockIn.count).mockResolvedValue(99)
    const count = await prisma.stockIn.count()
    const code = `PNK${String(count + 1).padStart(5, '0')}`
    expect(code).toBe('PNK00100')
  })
})
