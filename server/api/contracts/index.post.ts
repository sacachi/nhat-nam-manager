import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { SALE_ROLES } from '~/server/utils/roles'
import { uploadFileToDrive, getOrganizedFolderId } from '~/server/utils/google-drive'

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)

  if (!SALE_ROLES.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền upload hợp đồng' })
  }

  const query = getQuery(event)
  const projectId = query.project_id as string

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu project_id' })
  }

  const files = await readMultipartFormData(event)

  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Không có file nào được gửi' })
  }

  const file = files[0]

  if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Định dạng không hỗ trợ. Chỉ chấp nhận PDF, DOC, DOCX' })
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'File vượt quá 20MB' })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  // contracts/{year}/{month}/{id-projectName}
  const projectFolderId = await getOrganizedFolderId('contracts', projectId, project.name)

  const uploaded = await uploadFileToDrive(file.data, file.filename!, file.type!, projectFolderId)

  const contract = await prisma.contract.create({
    data: {
      project_id: projectId,
      file_name: file.filename!,
      drive_file_id: uploaded.fileId,
      drive_url: uploaded.webViewLink,
      file_type: getFileType(file.type!),
      file_size: file.data.length,
      uploaded_by: user.id,
      note: query.note as string || null
    },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'create',
      entity: 'contract',
      entity_id: contract.id,
      new_data: JSON.stringify(contract)
    }
  })

  return {
    ...contract,
    uploaded_by_name: contract.user.name
  }
})

function getFileType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType === 'application/msword') return 'doc'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  return 'other'
}
