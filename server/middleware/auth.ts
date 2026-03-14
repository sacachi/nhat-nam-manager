import { verifyToken } from '~/server/utils/jwt'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  
  // Only intercept API endpoints, leave frontend alone
  if (!path.startsWith('/api/')) return
  
  // These routes can skip authentication
  if (path.startsWith('/api/auth/login')) return
  
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized API Access' })
  }

  const decoded = verifyToken(token)
  
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid API Token' })
  }

  // Bind the parsed user payload to context so we can pull it freely
  event.context.user = decoded
})
