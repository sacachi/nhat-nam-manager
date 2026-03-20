import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBody(event)

  if (!['Admin', 'Sale'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo phiếu thu' })
  }

  if (!body.project_id) {
    throw createError({ statusCode: 400, statusMessage: 'project_id là bắt buộc' })
  }

  if (!body.amount || body.amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Số tiền phải lớn hơn 0' })
  }

  try {
    const receipt = await prisma.receipt.create({
      data: {
        project_id: body.project_id,
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
        entity: 'receipt',
        entity_id: receipt.id,
        new_data: JSON.stringify(receipt)
      }
    })

    return receipt
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
