import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBody(event)
  try {
    const expense = await prisma.expense.create({
      data: {
        project_id: body.project_id,
        type: body.type,
        amount: body.amount,
        date: body.date ? new Date(body.date) : new Date(),
        note: body.note,
        created_by: user.id
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'create',
        entity: 'expense',
        entity_id: expense.id,
        new_data: JSON.stringify(expense)
      }
    })

    return expense
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
