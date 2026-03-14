import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
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

  return receipts.map(({ user, ...receipt }) => ({
    ...receipt,
    created_by_name: user?.name || receipt.created_by
  }))
})
