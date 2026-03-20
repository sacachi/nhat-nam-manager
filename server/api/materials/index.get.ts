import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem vật tư' })
  }

  const materials = await prisma.material.findMany({
    orderBy: { created_at: 'desc' }
  })

  return materials.map(m => ({
    ...m,
    stock_value: m.current_stock * m.avg_cost
  }))
})
