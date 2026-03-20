import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  try {
    const oldData = await prisma.customer.findUnique({ where: { id } })
    if (oldData) {
      await prisma.customer.delete({ where: { id } })

      await prisma.activityLog.create({
        data: {
          user_id: event.context.user.id,
          action: 'delete',
          entity: 'customer',
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
