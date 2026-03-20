import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

const VALID_STATUSES = ['not_assigned', 'assigned', 'in_progress', 'review_requested', 'approved', 'rejected']

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing lead ID' })
  }

  const { design_status, design_note, design_files } = body

  if (!design_status || !VALID_STATUSES.includes(design_status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid design status' })
  }

  const lead = await prisma.customerLead.findUnique({
    where: { id },
    include: { designer: true }
  })

  if (!lead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
  }

  if (!lead.designer_id || lead.designer_id !== user.id) {
    if (user.role !== 'Admin') {
      throw createError({ statusCode: 403, statusMessage: 'Only assigned designer or admin can update design status' })
    }
  }

  const updateData: any = {
    design_status
  }

  if (design_note !== undefined) {
    updateData.design_note = design_note
  }

  if (design_files !== undefined) {
    updateData.design_files = typeof design_files === 'string' ? design_files : JSON.stringify(design_files)
  }

  const updatedLead = await prisma.customerLead.update({
    where: { id },
    data: updateData,
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
