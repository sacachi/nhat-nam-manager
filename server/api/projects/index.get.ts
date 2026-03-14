import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const projects = await prisma.project.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { name: true } },
      receipts: { select: { amount: true } },
      expenses: { select: { amount: true } }
    }
  })

  return projects.map(p => ({
    ...p,
    customer_name: p.customer?.name || null,
    total_received: p.receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
    total_spent: p.expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    receipts: undefined,
    expenses: undefined,
    customer: undefined
  }))
})
