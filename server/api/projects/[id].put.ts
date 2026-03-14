import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  const body = await readBody(event)
  try {
    const oldData = await prisma.project.findUnique({ where: { id } })
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        customer_id: body.customer_id || null,
        contract_value: body.contract_value,
        status: body.status,
        start_date: body.start_date ? new Date(body.start_date) : null,
        note: body.note
      }
    })

    if (oldData) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'update',
          entity: 'project',
          entity_id: project.id,
          old_data: JSON.stringify(oldData),
          new_data: JSON.stringify(project)
        }
      })
    }

    return project
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
