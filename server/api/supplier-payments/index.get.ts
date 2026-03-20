import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem thanh toán' })
  }

  const query = getQuery(event)
  const supplierId = query.supplier_id as string | undefined

  const where: any = {}
  if (supplierId) {
    where.supplier_id = supplierId
  }

  const payments = await prisma.supplierPayment.findMany({
    where,
    include: {
      supplier: true,
      user: { select: { id: true, name: true } }
    },
    orderBy: { created_at: 'desc' }
  })

  return payments.map(p => ({
    id: p.id,
    amount: p.amount,
    date: p.date,
    note: p.note,
    supplier: {
      id: p.supplier.id,
      name: p.supplier.name,
      code: p.supplier.code
    },
    user: p.user,
    created_at: p.created_at
  }))
})
