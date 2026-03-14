import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const expenses = await prisma.expense.findMany({
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  return expenses.map(({ user, ...expense }) => ({
    ...expense,
    created_by_name: user?.name || expense.created_by
  }))
})
