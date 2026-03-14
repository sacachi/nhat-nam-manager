import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  const body = await readBody(event)
  try {
    const oldData = await prisma.customer.findUnique({ where: { id } })
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        note: body.note
      }
    })

    if (oldData) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'update',
          entity: 'customer',
          entity_id: customer.id,
          old_data: JSON.stringify(oldData),
          new_data: JSON.stringify(customer)
        }
      })
    }
    return customer
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
