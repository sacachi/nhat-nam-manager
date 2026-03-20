import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  
  if (!['Admin', 'Sale'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền sửa phiếu thu' })
  }

  const existing = await prisma.receipt.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Phiếu thu không tồn tại' })
  }

  if (user.role === 'Sale' && existing.created_by !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Chỉ được sửa phiếu thu do bạn tạo' })
  }

  const body = await readBody(event)
  
  try {
    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        project_id: body.project_id,
        amount: body.amount,
        date: body.date ? new Date(body.date) : undefined,
        note: body.note,
        images: body.images !== undefined ? (body.images || null) : undefined
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'update',
        entity: 'receipt',
        entity_id: receipt.id,
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(receipt)
      }
    })
    return receipt
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
