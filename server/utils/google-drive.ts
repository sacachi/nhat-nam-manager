import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { Readable } from 'stream'

export interface DriveFileResult {
  fileId: string
  webViewLink: string
  thumbnailUrl: string
  webContentLink?: string
}

let cachedClient: OAuth2Client | null = null

export const getOAuth2Client = (): OAuth2Client => {
  const config = useRuntimeConfig()
  
  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string
  )

  oauth2Client.setCredentials({
    refresh_token: config.googleRefreshToken as string
  })

  return oauth2Client
}

export const getDriveClient = (): OAuth2Client => {
  if (cachedClient) return cachedClient
  cachedClient = getOAuth2Client()
  return cachedClient
}

export const uploadFileToDrive = async (
  buffer: Buffer | Uint8Array,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<DriveFileResult> => {
  const auth = getDriveClient()
  const drive = google.drive({ version: 'v3', auth })

  const requestBody: any = {
    name: fileName,
    parents: folderId ? [folderId] : undefined
  }

  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const media = {
    mimeType,
    body: Readable.from(buf)
  }

  const file = await drive.files.create({
    requestBody,
    media,
    fields: 'id, webViewLink, webContentLink'
  })

  if (!file.data.id || !file.data.webViewLink) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to upload file to Google Drive' })
  }

  // Make file publicly viewable so thumbnails work
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: { role: 'reader', type: 'anyone' }
  })

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink,
    thumbnailUrl: `https://lh3.googleusercontent.com/d/${file.data.id}`,
    webContentLink: file.data.webContentLink ?? undefined
  }
}

export const createDriveFolder = async (name: string, parentFolderId?: string): Promise<string> => {
  const auth = getDriveClient()
  const drive = google.drive({ version: 'v3', auth })

  const folderMeta: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined
  }

  const folder = await drive.files.create({
    requestBody: folderMeta,
    fields: 'id'
  })

  if (!folder.data.id) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create folder on Google Drive' })
  }

  return folder.data.id
}

export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const auth = getDriveClient()
  const drive = google.drive({ version: 'v3', auth })

  await drive.files.delete({ fileId })
}

export const getDriveFileLink = async (fileId: string): Promise<string> => {
  const auth = getDriveClient()
  const drive = google.drive({ version: 'v3', auth })

  const file = await drive.files.get({
    fileId,
    fields: 'webViewLink'
  })

  return file.data.webViewLink || ''
}

/**
 * Build organized folder path: root/{category}/{year}/{month}/{entityFolder}
 * entityFolder format: "{id}-{name}-{uid}" (sanitized)
 */
export const getOrganizedFolderId = async (
  category: string,
  entityId: string,
  entityName: string,
  date?: Date
): Promise<string> => {
  const config = useRuntimeConfig()
  const rootFolderId = config.googleDriveRootFolderId as string | undefined

  const d = date || new Date()
  const year = d.getFullYear().toString()
  const month = String(d.getMonth() + 1).padStart(2, '0')

  const safeName = entityName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s-]/g, '').trim().slice(0, 50)
  const shortId = entityId.slice(0, 8)
  const folderLabel = `${shortId}-${safeName}`

  const catFolder = await findOrCreateFolder(category, rootFolderId)
  const yearFolder = await findOrCreateFolder(year, catFolder)
  const monthFolder = await findOrCreateFolder(month, yearFolder)
  return findOrCreateFolder(folderLabel, monthFolder)
}

export const findOrCreateFolder = async (folderName: string, parentFolderId?: string): Promise<string> => {
  const auth = getDriveClient()
  const drive = google.drive({ version: 'v3', auth })

  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`
  const params: any = { q: query, fields: 'files(id, name)' }
  if (parentFolderId) {
    params.q = `${query} and '${parentFolderId}' in parents`
  }

  const result = await drive.files.list(params)

  if (result.data.files && result.data.files.length > 0) {
    return result.data.files[0].id!
  }

  return createDriveFolder(folderName, parentFolderId)
}
