import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem phiếu xuất kho' })
  }

  const query = getQuery(event)
  const projectId = query.project_id as string | undefined

  const where: any = {}
  if (projectId) {
    where.project_id = projectId
  }

  const stockOuts = await prisma.stockOut.findMany({
    where,
    include: {
      project: true,
      user: { select: { id: true, name: true } },
      items: {
        include: {
          material: true
        }
      },
      expense: {
        select: { id: true, amount: true, type: true }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return stockOuts.map(so => ({
    id: so.id,
    code: so.code,
    date: so.date,
    total_cost: so.total_cost,
    note: so.note,
    project: so.project ? {
      id: so.project.id,
      name: so.project.name
    } : null,
    user: so.user,
    expense: so.expense,
    items: so.items.map(item => ({
      id: item.id,
      material_id: item.material_id,
      material_name: item.material.name,
      material_code: item.material.code,
      unit: item.material.unit,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost
    })),
    created_at: so.created_at
  }))
})
