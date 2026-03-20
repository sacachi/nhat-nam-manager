import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  try {
    const oldData = await prisma.user.findUnique({ where: { id } })
    if (oldData) {
      await prisma.user.delete({ where: { id } })

      const { password, ...oldUserWithoutPassword } = oldData

      await prisma.activityLog.create({
        data: {
          user_id: event.context.user.id,
          action: 'delete',
          entity: 'user',
          entity_id: id,
          old_data: JSON.stringify(oldUserWithoutPassword)
        }
      })
    }
    return { success: true }
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
