import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing notification ID' })
  }

  const notification = await prisma.notification.findUnique({
    where: { id }
  })

  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
  }

  if (notification.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { is_read: true }
  })

  return updated
})
