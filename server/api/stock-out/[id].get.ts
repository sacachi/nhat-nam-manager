import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem phiếu xuất kho' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  }

  const stockOut = await prisma.stockOut.findUnique({
    where: { id },
    include: {
      project: true,
      user: { select: { id: true, name: true } },
      items: {
        include: {
          material: true
        }
      },
      expense: true
    }
  })

  if (!stockOut) {
    throw createError({ statusCode: 404, statusMessage: 'Phiếu xuất kho không tồn tại' })
  }

  return {
    id: stockOut.id,
    code: stockOut.code,
    date: stockOut.date,
    total_cost: stockOut.total_cost,
    note: stockOut.note,
    project: stockOut.project,
    user: stockOut.user,
    expense: stockOut.expense,
    items: stockOut.items.map(item => ({
      id: item.id,
      material_id: item.material_id,
      material_name: item.material.name,
      material_code: item.material.code,
      unit: item.material.unit,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost
    })),
    created_at: stockOut.created_at
  }
})
