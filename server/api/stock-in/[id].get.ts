import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem phiếu nhập kho' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  }

  const stockIn = await prisma.stockIn.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { id: true, name: true } },
      items: {
        include: {
          material: true
        }
      }
    }
  })

  if (!stockIn) {
    throw createError({ statusCode: 404, statusMessage: 'Phiếu nhập kho không tồn tại' })
  }

  return {
    id: stockIn.id,
    code: stockIn.code,
    date: stockIn.date,
    total_amount: stockIn.total_amount,
    paid_amount: stockIn.paid_amount,
    debt_amount: stockIn.total_amount - stockIn.paid_amount,
    note: stockIn.note,
    images: stockIn.images,
    supplier: stockIn.supplier,
    user: stockIn.user,
    items: stockIn.items.map(item => ({
      id: item.id,
      material_id: item.material_id,
      material_name: item.material.name,
      material_code: item.material.code,
      unit: item.material.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      avg_cost_before: item.avg_cost_before,
      avg_cost_after: item.avg_cost_after
    })),
    created_at: stockIn.created_at
  }
})
