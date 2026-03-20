import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing task ID' })

  const task = await prisma.projectTask.findUnique({ where: { id } })
  if (!task) throw createError({ statusCode: 404, statusMessage: 'Task not found' })

  const logs = await prisma.activityLog.findMany({
    where: {
      entity: 'project_task',
      entity_id: id
    },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { created_at: 'desc' }
  })

  return logs.map(({ user, ...log }) => ({
    ...log,
    user_name: user?.name || log.user_id
  }))
})
