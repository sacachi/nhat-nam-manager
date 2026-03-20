import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem báo cáo' })
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  })

  const totalDebt = suppliers.reduce((sum, s) => sum + (s.debt || 0), 0)

  const summary = await Promise.all(suppliers.map(async (supplier) => {
    const stockIns = await prisma.stockIn.aggregate({
      where: { supplier_id: supplier.id },
      _sum: { total_amount: true, paid_amount: true }
    })

    const payments = await prisma.supplierPayment.aggregate({
      where: { supplier_id: supplier.id },
      _sum: { amount: true }
    })

    const lastPayment = await prisma.supplierPayment.findFirst({
      where: { supplier_id: supplier.id },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    })

    return {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      phone: supplier.phone,
      total_imported: stockIns._sum.total_amount || 0,
      total_paid: stockIns._sum.paid_amount || 0,
      total_payment: payments._sum.amount || 0,
      debt: supplier.debt,
      last_payment_date: lastPayment?.created_at
    }
  }))

  return {
    suppliers: summary,
    totalDebt,
    totalSuppliers: suppliers.length,
    suppliersWithDebt: summary.filter(s => s.debt > 0).length
  }
})
