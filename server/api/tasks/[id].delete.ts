import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing task ID' })
  }

  const task = await prisma.projectTask.findUnique({
    where: { id }
  })

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  await prisma.projectTask.delete({
    where: { id }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'delete',
      entity: 'project_task',
      entity_id: id,
      old_data: JSON.stringify(task)
    }
  })

  return { success: true }
})
