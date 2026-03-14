import prisma from '~/server/utils/prisma'
import bcrypt from 'bcryptjs'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = getAuthUser(event)
  const body = await readBody(event)
  
  try {
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: body.username },
                { email: body.email }
            ]
        }
    })
    if (existingUser) {
        throw createError({ statusCode: 400, statusMessage: 'Username or Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        username: body.username,
        email: body.email,
        password: hashedPassword,
        role: body.role || 'Staff',
        status: body.status || 'active'
      }
    })

    const { password, ...userWithoutPassword } = user

    await prisma.activityLog.create({
      data: {
        user_id: authUser.id,
        action: 'create',
        entity: 'user',
        entity_id: user.id,
        new_data: JSON.stringify(userWithoutPassword)
      }
    })

    return userWithoutPassword
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode || 500, statusMessage: e.message })
  }
})
