import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo phiếu nhập kho' })
    }

    const body = await readBody(event)

    if (!body.supplier_id) {
      throw createError({ statusCode: 400, statusMessage: 'Nhà cung cấp là bắt buộc' })
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Phải có ít nhất 1 vật tư nhập kho' })
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: body.supplier_id } })
    if (!supplier) {
      throw createError({ statusCode: 404, statusMessage: 'Nhà cung cấp không tồn tại' })
    }

    for (const item of body.items) {
      if (!item.material_id) {
        throw createError({ statusCode: 400, statusMessage: 'Vật tư không hợp lệ' })
      }
      if (!item.quantity || item.quantity <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Số lượng phải lớn hơn 0' })
      }
      if (!item.unit_price || item.unit_price < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Đơn giá không hợp lệ' })
      }
    }

    const stockInCount = await prisma.stockIn.count()
    const code = `PNK${String(stockInCount + 1).padStart(5, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      const total_amount = body.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unit_price)
      }, 0)

      const stockIn = await tx.stockIn.create({
        data: {
          code,
          supplier_id: body.supplier_id,
          date: body.date ? new Date(body.date) : new Date(),
          total_amount,
          paid_amount: body.paid_amount || 0,
          note: body.note || null,
          created_by: user.id
        }
      })

      for (const item of body.items) {
        const material = await tx.material.findUnique({ where: { id: item.material_id } })
        if (!material) {
          throw new Error(`Vật tư không tồn tại: ${item.material_id}`)
        }

        const total_price = item.quantity * item.unit_price
        const avg_cost_before = material.avg_cost
        const new_total_value = (material.current_stock * material.avg_cost) + total_price
        const new_stock = material.current_stock + item.quantity
        const avg_cost_after = new_stock > 0 ? new_total_value / new_stock : 0

        await tx.stockInItem.create({
          data: {
            stock_in_id: stockIn.id,
            material_id: item.material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price,
            avg_cost_before,
            avg_cost_after
          }
        })

        await tx.material.update({
          where: { id: item.material_id },
          data: {
            current_stock: new_stock,
            avg_cost: avg_cost_after,
            stock_value: new_total_value
          }
        })

        await tx.stockLog.create({
          data: {
            material_id: item.material_id,
            type: 'IN',
            reference_id: stockIn.id,
            reference_code: code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            stock_before: material.current_stock,
            stock_after: new_stock,
            avg_cost_before,
            avg_cost_after,
            value_before: material.current_stock * material.avg_cost,
            value_after: new_total_value
          }
        })
      }

      await tx.supplier.update({
        where: { id: body.supplier_id },
        data: {
          debt: { increment: total_amount - (body.paid_amount || 0) }
        }
      })

      return stockIn
    })

    return result
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi tạo phiếu nhập kho:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi tạo phiếu nhập kho. Vui lòng thử lại.' })
  }
})
