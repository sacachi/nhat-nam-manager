import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing task ID' })
  }

  const task = await prisma.projectTask.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true, status: true, contract_value: true }
      },
      assignee: {
        select: { id: true, name: true, role: true }
      }
    }
  })

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return {
    ...task,
    assignee_name: task.assignee?.name || null,
    assignee_role: task.assignee?.role || null,
    project_name: task.project.name
  }
})
