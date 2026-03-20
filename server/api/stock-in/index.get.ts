import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem phiếu nhập kho' })
  }

  const query = getQuery(event)
  const supplierId = query.supplier_id as string | undefined

  const where: any = {}
  if (supplierId) {
    where.supplier_id = supplierId
  }

  const stockIns = await prisma.stockIn.findMany({
    where,
    include: {
      supplier: true,
      user: { select: { id: true, name: true } },
      items: {
        include: {
          material: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return stockIns.map(si => ({
    id: si.id,
    code: si.code,
    date: si.date,
    total_amount: si.total_amount,
    paid_amount: si.paid_amount,
    debt_amount: si.total_amount - si.paid_amount,
    note: si.note,
    supplier: {
      id: si.supplier.id,
      name: si.supplier.name,
      code: si.supplier.code
    },
    user: si.user,
    items: si.items.map(item => ({
      id: item.id,
      material_id: item.material_id,
      material_name: item.material.name,
      material_code: item.material.code,
      unit: item.material.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    })),
    created_at: si.created_at
  }))
})
