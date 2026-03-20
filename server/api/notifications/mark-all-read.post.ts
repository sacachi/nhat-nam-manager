import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)

  const result = await prisma.notification.updateMany({
    where: {
      user_id: user.id,
      is_read: false
    },
    data: {
      is_read: true
    }
  })

  return { success: true, updated: result.count }
})
