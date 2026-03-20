import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền hủy thanh toán' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
    }

    const payment = await prisma.supplierPayment.findUnique({
      where: { id },
      include: { supplier: true }
    })

    if (!payment) {
      throw createError({ statusCode: 404, statusMessage: 'Thanh toán không tồn tại' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.supplier.update({
        where: { id: payment.supplier_id },
        data: {
          debt: { increment: payment.amount }
        }
      })

      await tx.supplierPayment.delete({ where: { id } })
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi hủy thanh toán:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Lỗi khi hủy thanh toán. Vui lòng thử lại.' })
  }
})
