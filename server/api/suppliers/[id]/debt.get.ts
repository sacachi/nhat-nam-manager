import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem công nợ' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      stockIns: {
        include: {
          items: true
        },
        orderBy: { created_at: 'desc' }
      },
      supplierPayments: {
        include: { user: { select: { name: true } } },
        orderBy: { created_at: 'desc' }
      }
    }
  })

  if (!supplier) {
    throw createError({ statusCode: 404, statusMessage: 'Nhà cung cấp không tồn tại' })
  }

  const stockIns = supplier.stockIns.map(si => ({
    id: si.id,
    code: si.code,
    date: si.date,
    total_amount: si.total_amount,
    paid_amount: si.paid_amount,
    debt: si.total_amount - si.paid_amount,
    items: si.items.map(item => ({
      material_name: item.material_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    })),
    created_at: si.created_at
  }))

  const payments = supplier.supplierPayments.map(p => ({
    id: p.id,
    amount: p.amount,
    date: p.date,
    note: p.note,
    user: p.user,
    created_at: p.created_at
  }))

  return {
    supplier: {
      id: supplier.id,
      name: supplier.name,
      code: supplier.code,
      debt: supplier.debt
    },
    stockIns,
    payments
  }
})
