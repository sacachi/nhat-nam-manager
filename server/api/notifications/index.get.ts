import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)

  const where: any = { user_id: user.id }

  if (query.unread === 'true') {
    where.is_read = false
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 50
  })

  const unreadCount = await prisma.notification.count({
    where: { user_id: user.id, is_read: false }
  })

  return {
    notifications,
    unreadCount
  }
})
