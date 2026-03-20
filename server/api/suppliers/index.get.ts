import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem nhà cung cấp' })
  }

  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: {
          stockIns: true,
          supplierPayments: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return suppliers.map(s => ({
    id: s.id,
    name: s.name,
    code: s.code,
    phone: s.phone,
    email: s.email,
    address: s.address,
    tax_code: s.tax_code,
    note: s.note,
    status: s.status,
    _count: s._count,
    created_at: s.created_at
  }))
})
