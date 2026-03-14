import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const decoded: any = verifyToken(token)
  
  if (!decoded) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id }
  })

  if (!user || user.status !== 'active') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { password, ...userWithoutPassword } = user

  return { user: userWithoutPassword }
})
