import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo thanh toán' })
    }

    const body = await readBody(event)

    if (!body.supplier_id) {
      throw createError({ statusCode: 400, statusMessage: 'Nhà cung cấp là bắt buộc' })
    }

    if (!body.amount || body.amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Số tiền phải lớn hơn 0' })
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: body.supplier_id } })
    if (!supplier) {
      throw createError({ statusCode: 404, statusMessage: 'Nhà cung cấp không tồn tại' })
    }

    if (body.amount > supplier.debt) {
      throw createError({ statusCode: 400, statusMessage: `Số tiền thanh toán không được lớn hơn công nợ hiện tại (${supplier.debt.toLocaleString()}đ)` })
    }

    const payment = await prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
        data: {
          supplier_id: body.supplier_id,
          amount: body.amount,
          date: body.date ? new Date(body.date) : new Date(),
          note: body.note || null,
          created_by: user.id
        }
      })

      await tx.supplier.update({
        where: { id: body.supplier_id },
        data: {
          debt: { decrement: body.amount }
        }
      })

      return payment
    })

    return payment
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi tạo thanh toán:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi tạo thanh toán. Vui lòng thử lại.' })
  }
})
