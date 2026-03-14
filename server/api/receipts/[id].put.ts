import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  
  const body = await readBody(event)
  try {
    const oldData = await prisma.receipt.findUnique({ where: { id } })
    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        project_id: body.project_id,
        amount: body.amount,
        date: body.date ? new Date(body.date) : undefined,
        note: body.note
      }
    })

    if (oldData) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          action: 'update',
          entity: 'receipt',
          entity_id: receipt.id,
          old_data: JSON.stringify(oldData),
          new_data: JSON.stringify(receipt)
        }
      })
    }
    return receipt
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
