import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền hủy phiếu xuất kho' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
    }

    const stockOut = await prisma.stockOut.findUnique({
      where: { id },
      include: {
        items: {
          include: { material: true }
        },
        expense: true
      }
    })

    if (!stockOut) {
      throw createError({ statusCode: 404, statusMessage: 'Phiếu xuất kho không tồn tại' })
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of stockOut.items) {
        const new_stock = item.material.current_stock + item.quantity

        await tx.material.update({
          where: { id: item.material_id },
          data: {
            current_stock: new_stock,
            stock_value: new_stock * item.material.avg_cost
          }
        })

        await tx.stockLog.create({
          data: {
            material_id: item.material_id,
            type: 'CANCEL_OUT',
            reference_id: stockOut.id,
            reference_code: stockOut.code,
            quantity: item.quantity,
            unit_price: item.unit_cost,
            stock_before: item.material.current_stock,
            stock_after: new_stock,
            avg_cost_before: item.material.avg_cost,
            avg_cost_after: item.material.avg_cost,
            value_before: item.material.current_stock * item.material.avg_cost,
            value_after: new_stock * item.material.avg_cost
          }
        })
      }

      if (stockOut.expense_id) {
        await tx.expense.delete({ where: { id: stockOut.expense_id } })
      }

      await tx.stockOutItem.deleteMany({ where: { stock_out_id: id } })
      await tx.stockOut.delete({ where: { id } })

      return { success: true }
    })

    return result
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi hủy phiếu xuất kho:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Lỗi khi hủy phiếu xuất kho. Vui lòng thử lại.' })
  }
})
