import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  return await prisma.customer.findMany({
    orderBy: { created_at: 'desc' }
  })
})
