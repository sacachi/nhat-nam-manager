import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'
import { deleteDriveFile } from '~/server/utils/google-drive'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const contract = await prisma.contract.findUnique({ where: { id } })
  if (!contract) {
    return { success: true }
  }

  try {
    await deleteDriveFile(contract.drive_file_id)
  } catch (e) {
    console.error('Failed to delete file from Drive:', e)
  }

  await prisma.contract.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      user_id: event.context.user.id,
      action: 'delete',
      entity: 'contract',
      entity_id: id,
      old_data: JSON.stringify(contract)
    }
  })

  return { success: true }
})
