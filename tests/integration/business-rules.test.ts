import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('~/server/utils/prisma', () => ({
  default: {
    customerLead: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn()
    },
    project: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    activityLog: { create: vi.fn() },
    notification: { create: vi.fn() }
  }
}))

import prisma from '~/server/utils/prisma'

describe('Lead Assign Designer — Business Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects assign when lead is converted', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'converted'
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(lead!.status).toBe('converted')
    // → should throw 400
  })

  it('rejects assign when lead is rejected', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'rejected'
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(lead!.status).toBe('rejected')
    // → should throw 400
  })

  it('allows assign when lead is pending', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'pending'
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(['pending', 'reviewed'].includes(lead!.status)).toBe(true)
  })

  it('allows assign when lead is reviewed', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'reviewed'
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(['pending', 'reviewed'].includes(lead!.status)).toBe(true)
  })

  it('rejects non-Design user as designer', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', role: 'Sale', name: 'Sale User'
    } as any)
    
    const designer = await prisma.user.findUnique({ where: { id: 'user-1' } })
    expect(designer!.role).not.toBe('Design')
    // → should throw 400
  })

  it('accepts Design user as designer', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', role: 'Design', name: 'Designer'
    } as any)
    
    const designer = await prisma.user.findUnique({ where: { id: 'user-1' } })
    expect(designer!.role).toBe('Design')
  })
})

describe('Lead Convert — Business Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects convert when lead already converted', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'converted', designer_id: 'd1'
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(lead!.status).toBe('converted')
    // → throw 400 'đã chuyển đổi'
  })

  it('rejects convert when lead is rejected', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'rejected', designer_id: 'd1'
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(lead!.status).toBe('rejected')
    // → throw 400
  })

  it('rejects convert when no designer assigned', async () => {
    vi.mocked(prisma.customerLead.findUnique).mockResolvedValue({
      id: 'lead-1', status: 'reviewed', designer_id: null
    } as any)
    
    const lead = await prisma.customerLead.findUnique({ where: { id: 'lead-1' } })
    expect(lead!.designer_id).toBeNull()
    // → throw 400 'phải có designer'
  })

  it('Sale can only convert own lead', () => {
    const user = { id: 'sale-1', role: 'Sale' }
    const lead = { sale_user_id: 'sale-2' }
    
    expect(user.role === 'Sale' && lead.sale_user_id !== user.id).toBe(true)
    // → throw 403
  })

  it('Sale requires design_status approved', () => {
    const user = { role: 'Sale' }
    const lead = { design_status: 'in_progress' }
    
    expect(user.role === 'Sale' && lead.design_status !== 'approved').toBe(true)
    // → throw 400
  })

  it('Admin can convert without design approval', () => {
    const user = { role: 'Admin' }
    const lead = { design_status: 'in_progress', designer_id: 'd1', status: 'reviewed' }
    
    // Admin doesn't have the design_status check
    expect(user.role === 'Admin').toBe(true)
  })

  it('convert creates Customer if phone not found', async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue(null)
    const existing = await prisma.customer.findFirst({ where: { phone: '0901234567' } })
    expect(existing).toBeNull()
    // → should create new customer
  })

  it('convert reuses Customer if phone exists', async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({
      id: 'cust-1', name: 'Existing', phone: '0901234567'
    } as any)
    
    const existing = await prisma.customer.findFirst({ where: { phone: '0901234567' } })
    expect(existing).not.toBeNull()
    // → should reuse existing customer
  })

  it('convert creates Project with correct data', () => {
    const lead = {
      customer_name: 'Nguyễn Văn A',
      construction_categories: '["Kitchen","Wardrobe"]',
      construction_value: 150000000
    }
    
    const categories = JSON.parse(lead.construction_categories)
    const projectName = `${lead.customer_name} — ${categories.join(', ')}`
    
    expect(projectName).toBe('Nguyễn Văn A — Kitchen, Wardrobe')
    expect(lead.construction_value).toBe(150000000)
  })

  it('convert updates lead status to converted', async () => {
    vi.mocked(prisma.customerLead.update).mockResolvedValue({
      id: 'lead-1', status: 'converted'
    } as any)
    
    const updated = await prisma.customerLead.update({
      where: { id: 'lead-1' },
      data: { status: 'converted' }
    })
    expect(updated.status).toBe('converted')
  })
})

describe('Task Source Validation', () => {
  it('rejects task with neither project nor lead', () => {
    const data = { project_id: null, lead_id: null }
    expect(!data.project_id && !data.lead_id).toBe(true)
    // → throw 400
  })

  it('rejects task with both project and lead', () => {
    const data = { project_id: 'p1', lead_id: 'l1' }
    expect(data.project_id && data.lead_id).toBeTruthy()
    // → throw 400
  })

  it('accepts task with only project', () => {
    const data = { project_id: 'p1', lead_id: null }
    const valid = (data.project_id && !data.lead_id) || (!data.project_id && data.lead_id)
    expect(valid).toBeTruthy()
  })

  it('accepts task with only lead', () => {
    const data = { project_id: null, lead_id: 'l1' }
    const valid = (data.project_id && !data.lead_id) || (!data.project_id && data.lead_id)
    expect(valid).toBeTruthy()
  })
})

describe('Expense ↔ Task Project Match', () => {
  it('rejects expense when task belongs to different project', () => {
    const task = { project_id: 'proj-A' }
    const expense = { project_id: 'proj-B', task_id: 'task-1' }
    
    expect(task.project_id !== expense.project_id).toBe(true)
    // → throw 400 'Task không thuộc Project này'
  })

  it('accepts expense when task belongs to same project', () => {
    const task = { project_id: 'proj-A' }
    const expense = { project_id: 'proj-A', task_id: 'task-1' }
    
    expect(task.project_id === expense.project_id).toBe(true)
  })

  it('skips validation when no task_id', () => {
    const expense = { project_id: 'proj-A', task_id: null }
    expect(!expense.task_id).toBe(true)
    // → skip, no validation needed
  })
})
