import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { uploadFileToDrive, getOrganizedFolderId } from '~/server/utils/google-drive'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing lead ID' })
  }

  const lead = await prisma.customerLead.findUnique({
    where: { id }
  })

  if (!lead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
  }

  if (!lead.designer_id || lead.designer_id !== user.id) {
    if (user.role !== 'Admin') {
      throw createError({ statusCode: 403, statusMessage: 'Only assigned designer or admin can upload design files' })
    }
  }

  const files = await readMultipartFormData(event)

  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' })
  }

  if (files.length > 20) {
    throw createError({ statusCode: 400, statusMessage: 'Maximum 20 files allowed' })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  const maxSize = 20 * 1024 * 1024

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      throw createError({ statusCode: 400, statusMessage: `File type ${file.type} not supported` })
    }
    if (file.data.length > maxSize) {
      throw createError({ statusCode: 400, statusMessage: 'File size exceeds 20MB limit' })
    }
  }

  // leads/{year}/{month}/{id-customerName}/designs
  const leadFolder = await getOrganizedFolderId('leads', id, lead.customer_name, lead.created_at)
  const { findOrCreateFolder } = await import('~/server/utils/google-drive')
  const folderId = await findOrCreateFolder('designs', leadFolder)

  const uploadedFiles = []
  for (const file of files) {
    const uploaded = await uploadFileToDrive(file.data, file.filename || 'design', file.type, folderId)
    uploadedFiles.push({
      fileId: uploaded.fileId,
      url: uploaded.webViewLink,
      thumbnailUrl: uploaded.thumbnailUrl,
      name: file.filename || 'design'
    })
  }

  let existingFiles: any[] = []
  if (lead.design_files) {
    try {
      existingFiles = JSON.parse(lead.design_files)
    } catch {
      existingFiles = []
    }
  }

  const allFiles = [...existingFiles, ...uploadedFiles]

  let newStatus = lead.design_status
  if (lead.design_status === 'assigned') {
    newStatus = 'in_progress'
  }

  const updatedLead = await prisma.customerLead.update({
    where: { id },
    data: {
      design_files: JSON.stringify(allFiles),
      design_status: newStatus
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

  return {
    files: uploadedFiles,
    totalFiles: allFiles.length,
    lead: updatedLead
  }
})
