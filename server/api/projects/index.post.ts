import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  if (['Design', 'Construction'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo công trình' })
  }
  const body = await readBody(event)
  try {
    const project = await prisma.project.create({
      data: {
        name: body.name,
        customer_id: body.customer_id || null,
        contract_value: body.contract_value,
        status: body.status || 'đang thi công',
        start_date: body.start_date ? new Date(body.start_date) : null,
        note: body.note
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'create',
        entity: 'project',
        entity_id: project.id,
        new_data: JSON.stringify(project)
      }
    })

    return project
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
