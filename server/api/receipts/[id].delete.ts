import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  try {
    const oldData = await prisma.receipt.findUnique({ where: { id } })
    if (oldData) {
      await prisma.receipt.delete({ where: { id } })

      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'delete',
          entity: 'receipt',
          entity_id: id,
          old_data: JSON.stringify(oldData)
        }
      })
    }
    return { success: true }
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
