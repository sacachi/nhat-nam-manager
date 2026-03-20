import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  // Aggregate by month for the current year
  const currentYear = new Date().getFullYear()
  
  const receipts = await prisma.receipt.findMany({
    where: { date: { gte: new Date(`${currentYear}-01-01`), lte: new Date(`${currentYear}-12-31T23:59:59.999Z`) } }
  })
  
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: new Date(`${currentYear}-01-01`), lte: new Date(`${currentYear}-12-31T23:59:59.999Z`) } }
  })

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, received: 0, spent: 0 }))
  
  receipts.forEach(r => {
    const m = r.date.getMonth()
    monthlyData[m].received += r.amount || 0
  })
  
  expenses.forEach(e => {
    const m = e.date.getMonth()
    monthlyData[m].spent += e.amount || 0
  })

  // Project-specific breakdown
  const projects = await prisma.project.findMany()
  const pReceipts = await prisma.receipt.groupBy({ by: ['project_id'], _sum: { amount: true } })
  const pExpenses = await prisma.expense.groupBy({ by: ['project_id'], _sum: { amount: true } })

  const projectBreakdown = projects.map(p => {
    const r = pReceipts.find(pr => pr.project_id === p.id)?._sum.amount || 0
    const e = pExpenses.find(pe => pe.project_id === p.id)?._sum.amount || 0
    return { name: p.name, received: r, spent: e }
  })

  return { currentYear, monthlyData, projectBreakdown }
})
