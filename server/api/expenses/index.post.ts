import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { validateRequired, validatePositiveNumber, validateEnum } from '~/server/utils/validate'
import { validateProjectExists, validateTaskExists, validateExpenseTaskProjectMatch } from '~/server/utils/business-rules'

const VALID_TYPES = ['material', 'labor', 'other']

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBody(event)

  if (!['Admin', 'Construction', 'Sale'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo chi phí' })
  }

  validateRequired(body.project_id, 'Công trình')
  validateRequired(body.type, 'Loại chi phí')
  validateRequired(body.amount, 'Số tiền')
  
  validateEnum(body.type, VALID_TYPES, 'Loại chi phí')
  validatePositiveNumber(body.amount, 'Số tiền')
  
  await validateProjectExists(body.project_id)
  
  if (body.task_id) {
    await validateTaskExists(body.task_id)
    await validateExpenseTaskProjectMatch({ project_id: body.project_id, task_id: body.task_id })
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        project_id: body.project_id,
        task_id: body.task_id || null,
        type: body.type,
        amount: body.amount,
        date: body.date ? new Date(body.date) : new Date(),
        note: body.note || null,
        images: body.images || null,
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
