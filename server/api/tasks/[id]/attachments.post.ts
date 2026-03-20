import { getAuthUser } from '~/server/utils/auth'
import { uploadFileToDrive, getOrganizedFolderId } from '~/server/utils/google-drive'
import prisma from '~/server/utils/prisma'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/pdf']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_FILES = 20

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const taskId = getRouterParam(event, 'id')
  if (!taskId) throw createError({ statusCode: 400, statusMessage: 'Missing task ID' })

  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { name: true } },
      lead: { select: { customer_name: true } }
    }
  })
  if (!task) throw createError({ statusCode: 404, statusMessage: 'Task not found' })

  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Không có file nào được gửi' })
  }
  if (files.length > MAX_FILES) {
    throw createError({ statusCode: 400, statusMessage: `Tối đa ${MAX_FILES} files` })
  }

  for (const file of files) {
    if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
      throw createError({ statusCode: 400, statusMessage: `Định dạng không hỗ trợ: ${file.filename}` })
    }
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({ statusCode: 400, statusMessage: `File ${file.filename} vượt quá 20MB` })
    }
  }

  const sourceName = task.project?.name || task.lead?.customer_name || 'task'
  const folderId = await getOrganizedFolderId('tasks', taskId, `${sourceName}-${task.title}`)

  const results = []
  for (const file of files) {
    const uploaded = await uploadFileToDrive(file.data, file.filename!, file.type!, folderId)
    results.push({
      fileId: uploaded.fileId,
      url: uploaded.webViewLink,
      thumbnailUrl: uploaded.thumbnailUrl,
      name: file.filename
    })
  }

  // Merge with existing attachments
  let existing = []
  try {
    existing = task.attachments ? JSON.parse(task.attachments) : []
  } catch { existing = [] }

  const allAttachments = [...existing, ...results]

  await prisma.projectTask.update({
    where: { id: taskId },
    data: { attachments: JSON.stringify(allAttachments) }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'update',
      entity: 'project_task',
      entity_id: taskId,
      old_data: JSON.stringify({ attachments: task.attachments }),
      new_data: JSON.stringify({ attachments: JSON.stringify(allAttachments) })
    }
  })

  return { files: results, total: allAttachments.length }
})
