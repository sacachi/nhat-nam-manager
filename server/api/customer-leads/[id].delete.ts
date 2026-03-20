import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'
import { deleteDriveFile } from '~/server/utils/google-drive'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const oldLead = await prisma.customerLead.findUnique({ where: { id } })
  if (!oldLead) {
    return { success: true }
  }

  if (oldLead.images) {
    try {
      const images = JSON.parse(oldLead.images)
      for (const img of images) {
        if (img.fileId) {
          await deleteDriveFile(img.fileId)
        }
      }
    } catch {}
  }

  await prisma.customerLead.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      user_id: event.context.user.id,
      action: 'delete',
      entity: 'customer_lead',
      entity_id: id,
      old_data: JSON.stringify(oldLead)
    }
  })

  return { success: true }
})
