import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const projectsCount = await prisma.project.count()
  
  const receipts = await prisma.receipt.aggregate({
    _sum: { amount: true }
  })
  
  const expenses = await prisma.expense.aggregate({
    _sum: { amount: true }
  })

  // Recent 5 logs
  const recentLogs = await prisma.activityLog.findMany({
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: 5
  })

  return {
    projects: projectsCount,
    totalReceived: receipts._sum.amount || 0,
    totalSpent: expenses._sum.amount || 0,
    recentLogs: recentLogs.map(({ user, ...log }) => ({
      ...log,
      user_name: user?.name || log.user_id
    }))
  }
})
