import prisma from '~/server/utils/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.username || !body.password) {
    throw createError({ statusCode: 400, statusMessage: 'Thiếu tên đăng nhập hoặc mật khẩu' })
  }

  const user = await prisma.user.findUnique({
    where: { username: body.username }
  })

  if (!user || user.status !== 'active') {
    throw createError({ statusCode: 401, statusMessage: 'Tài khoản không tồn tại hoặc đã bị khóa' })
  }

  const isValidPassword = await bcrypt.compare(body.password, user.password)

  if (!isValidPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Mật khẩu không chính xác' })
  }

  const token = signToken({ id: user.id, role: user.role, username: user.username, name: user.name })
  
  // Lệnh tự động Set Cookie về cho Client luôn để bảo mật XSS (HttpOnly)
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 1 day
  })

  const { password, ...userWithoutPassword } = user

  return { user: userWithoutPassword }
})
