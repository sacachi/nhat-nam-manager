import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })

  if (user.role === 'Design') {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền sửa chi phí' })
  }

  const existing = await prisma.expense.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Chi phí không tồn tại' })
  }

  if (user.role === 'Construction' && existing.created_by !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Chỉ được sửa chi phí do bạn tạo' })
  }

  const body = await readBody(event)
  
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        project_id: body.project_id,
        type: body.type,
        amount: body.amount,
        date: body.date ? new Date(body.date) : undefined,
        note: body.note,
        task_id: body.task_id !== undefined ? (body.task_id || null) : undefined,
        images: body.images !== undefined ? (body.images || null) : undefined
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'update',
        entity: 'expense',
        entity_id: expense.id,
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(expense)
      }
    })
    return expense
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
