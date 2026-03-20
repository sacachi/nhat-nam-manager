import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.googleClientId || !config.googleClientSecret || !config.googleRedirectUri) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Google OAuth chưa được cấu hình. Vui lòng thêm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, và GOOGLE_REDIRECT_URI vào file .env'
    })
  }

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string
  )

  const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
  ]

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })

  return sendRedirect(event, authUrl)
})
