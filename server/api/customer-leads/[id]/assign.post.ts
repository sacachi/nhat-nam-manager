import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/roles'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing lead ID' })
  }

  const { designer_id, design_deadline } = body

  if (!designer_id) {
    throw createError({ statusCode: 400, statusMessage: 'Designer ID is required' })
  }

  const designer = await prisma.user.findUnique({
    where: { id: designer_id }
  })

  if (!designer || designer.role !== 'Design') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid designer' })
  }

  const lead = await prisma.customerLead.findUnique({
    where: { id }
  })

  if (!lead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
  }

  if (lead.status !== 'pending' && lead.status !== 'reviewed') {
    throw createError({ statusCode: 400, statusMessage: 'Lead must be pending or reviewed before assigning designer' })
  }

  const updatedLead = await prisma.customerLead.update({
    where: { id },
    data: {
      designer_id,
      design_deadline: design_deadline ? new Date(design_deadline) : null,
      design_status: 'assigned'
    },
    include: {
      designer: {
        select: { id: true, name: true, email: true }
      },
      sale_user: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'update',
      entity: 'customer_lead',
      entity_id: lead.id,
      old_data: JSON.stringify(lead),
      new_data: JSON.stringify(updatedLead)
    }
  })

  return updatedLead
})
