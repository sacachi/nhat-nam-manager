import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)

  if (user.role === 'Design') {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem chi phí' })
  }

  const where = user.role === 'Construction' 
    ? { created_by: user.id } 
    : {}

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  return expenses.map(({ user: u, ...expense }) => ({
    ...expense,
    created_by_name: u?.name || expense.created_by
  }))
})
