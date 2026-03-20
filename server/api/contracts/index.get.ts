import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  getAuthUser(event)
  const query = getQuery(event)

  if (!query.project_id) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu project_id' })
  }

  const contracts = await prisma.contract.findMany({
    where: { project_id: query.project_id as string },
    include: {
      user: {
        select: { id: true, name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return contracts.map(c => ({
    ...c,
    uploaded_by_name: c.user.name
  }))
})
