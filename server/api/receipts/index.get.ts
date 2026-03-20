import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (['Design', 'Construction'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem phiếu thu' })
  }

  const receipts = await prisma.receipt.findMany({
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  return receipts.map(({ user: u, ...receipt }) => ({
    ...receipt,
    created_by_name: u?.name || receipt.created_by
  }))
})
