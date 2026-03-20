import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const canViewFinance = ['Admin', 'Sale'].includes(user.role)

  const projects = await prisma.project.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { name: true } },
      receipts: { select: { amount: true } },
      expenses: { select: { amount: true, created_by: true } },
      tasks: { select: { id: true, status: true } }
    }
  })

  return projects.map(p => {
    const base = {
      id: p.id,
      name: p.name,
      status: p.status,
      start_date: p.start_date,
      created_at: p.created_at,
      customer_name: p.customer?.name || null,
      tasks_count: p.tasks.length,
      tasks_completed: p.tasks.filter(t => t.status === 'completed').length,
      tasks_pending: p.tasks.filter(t => t.status !== 'completed').length,
    }

    if (canViewFinance) {
      return {
        ...base,
        contract_value: p.contract_value,
        total_received: p.receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
        total_spent: p.expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      }
    }

    return base
  })
})
