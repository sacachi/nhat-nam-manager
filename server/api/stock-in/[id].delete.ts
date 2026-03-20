import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền hủy phiếu nhập kho' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
    }

    const stockIn = await prisma.stockIn.findUnique({
      where: { id },
      include: {
        items: {
          include: { material: true }
        }
      }
    })

    if (!stockIn) {
      throw createError({ statusCode: 404, statusMessage: 'Phiếu nhập kho không tồn tại' })
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of stockIn.items) {
        const new_stock = item.material.current_stock - item.quantity
        if (new_stock < 0) {
          throw new Error(`Không thể hủy vì vật tư "${item.material.name}" đã được xuất nhiều hơn số lượng nhập`)
        }

        const new_total_value = new_stock * item.material.avg_cost

        await tx.material.update({
          where: { id: item.material_id },
          data: {
            current_stock: new_stock,
            stock_value: new_stock > 0 ? new_total_value : 0
          }
        })

        await tx.stockLog.create({
          data: {
            material_id: item.material_id,
            type: 'CANCEL_IN',
            reference_id: stockIn.id,
            reference_code: stockIn.code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            stock_before: item.material.current_stock,
            stock_after: new_stock,
            avg_cost_before: item.material.avg_cost,
            avg_cost_after: item.material.avg_cost,
            value_before: item.material.current_stock * item.material.avg_cost,
            value_after: new_stock * item.material.avg_cost
          }
        })
      }

      await tx.supplier.update({
        where: { id: stockIn.supplier_id },
        data: {
          debt: { decrement: stockIn.total_amount - stockIn.paid_amount }
        }
      })

      await tx.stockInItem.deleteMany({ where: { stock_in_id: id } })
      await tx.stockIn.delete({ where: { id } })

      return { success: true }
    })

    return result
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi hủy phiếu nhập kho:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Lỗi khi hủy phiếu nhập kho. Vui lòng thử lại.' })
  }
})
