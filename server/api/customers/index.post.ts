import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBody(event)
  try {
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        note: body.note
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'create',
        entity: 'customer',
        entity_id: customer.id,
        new_data: JSON.stringify(customer)
      }
    })

    return customer
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
