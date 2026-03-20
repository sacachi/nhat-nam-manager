import { getAuthUser } from '~/server/utils/auth'
import { uploadFileToDrive, getOrganizedFolderId } from '~/server/utils/google-drive'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)
  const leadName = (query.lead_name as string) || 'temp'
  const leadId = (query.lead_id as string) || `temp-${Date.now()}`

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
      throw createError({ statusCode: 400, statusMessage: `File ${file.filename} vượt quá 10MB` })
    }
  }

  // leads/{year}/{month}/{id-name}
  const folderId = await getOrganizedFolderId('leads', leadId, leadName)

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

  return {
    folderId,
    files: results
  }
})
