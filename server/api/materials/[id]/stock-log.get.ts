import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem lịch sử tồn kho' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  }

  const material = await prisma.material.findUnique({ where: { id } })
  if (!material) {
    throw createError({ statusCode: 404, statusMessage: 'Vật tư không tồn tại' })
  }

  const stockLogs = await prisma.stockLog.findMany({
    where: { material_id: id },
    orderBy: { created_at: 'desc' }
  })

  return stockLogs.map(log => ({
    id: log.id,
    type: log.type,
    reference_id: log.reference_id,
    reference_code: log.reference_code,
    quantity: log.quantity,
    unit_price: log.unit_price,
    stock_before: log.stock_before,
    stock_after: log.stock_after,
    avg_cost_before: log.avg_cost_before,
    avg_cost_after: log.avg_cost_after,
    created_at: log.created_at
  }))
})
