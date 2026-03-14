import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  const body = await readBody(event)

  try {
    const oldData = await prisma.user.findUnique({ where: { id } })
    if (!oldData) throw createError({ statusCode: 404, statusMessage: 'User Not Found' })

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        status: body.status
      }
    })

    const { password: oldPassword, ...oldUserWithoutPassword } = oldData
    const { password: newPassword, ...newUserWithoutPassword } = user

    await prisma.activityLog.create({
        data: {
          user_id: authUser.id,
          action: 'update',
          entity: 'user',
          entity_id: user.id,
          old_data: JSON.stringify(oldUserWithoutPassword),
          new_data: JSON.stringify(newUserWithoutPassword)
        }
    })

    return newUserWithoutPassword
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode || 500, statusMessage: e.message })
  }
})
