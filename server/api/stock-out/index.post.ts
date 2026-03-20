import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo phiếu xuất kho' })
    }

    const body = await readBody(event)

    if (!body.project_id) {
      throw createError({ statusCode: 400, statusMessage: 'Công trình là bắt buộc' })
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Phải có ít nhất 1 vật tư xuất kho' })
    }

    const project = await prisma.project.findUnique({ where: { id: body.project_id } })
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Công trình không tồn tại' })
    }

    for (const item of body.items) {
      if (!item.material_id) {
        throw createError({ statusCode: 400, statusMessage: 'Vật tư không hợp lệ' })
      }
      if (!item.quantity || item.quantity <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Số lượng phải lớn hơn 0' })
      }
    }

    const stockOutCount = await prisma.stockOut.count()
    const code = `PXK${String(stockOutCount + 1).padStart(5, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      for (const item of body.items) {
        const material = await tx.material.findUnique({ where: { id: item.material_id } })
        if (!material) {
          throw new Error(`Vật tư không tồn tại: ${item.material_id}`)
        }
        if (material.current_stock < item.quantity) {
          throw new Error(`Vật tư "${material.name}" không đủ tồn kho. Tồn: ${material.current_stock} ${material.unit}`)
        }
      }

      const total_cost = body.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unit_cost)
      }, 0)

      const expense = await tx.expense.create({
        data: {
          project_id: body.project_id,
          task_id: body.task_id || null,
          type: 'material',
          amount: total_cost,
          date: body.date ? new Date(body.date) : new Date(),
          note: body.note || `Xuất kho vật tư cho công trình`,
          created_by: user.id
        }
      })

      const stockOut = await tx.stockOut.create({
        data: {
          code,
          project_id: body.project_id,
          date: body.date ? new Date(body.date) : new Date(),
          total_cost,
          note: body.note || null,
          expense_id: expense.id,
          created_by: user.id
        }
      })

      for (const item of body.items) {
        const material = await tx.material.findUnique({ where: { id: item.material_id } })
        if (!material) continue

        const total_cost_item = item.quantity * item.unit_cost

        await tx.stockOutItem.create({
          data: {
            stock_out_id: stockOut.id,
            material_id: item.material_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: total_cost_item
          }
        })

        await tx.material.update({
          where: { id: item.material_id },
          data: {
            current_stock: material.current_stock - item.quantity,
            stock_value: (material.current_stock - item.quantity) * material.avg_cost
          }
        })

        await tx.stockLog.create({
          data: {
            material_id: item.material_id,
            type: 'OUT',
            reference_id: stockOut.id,
            reference_code: code,
            quantity: item.quantity,
            unit_price: item.unit_cost,
            stock_before: material.current_stock,
            stock_after: material.current_stock - item.quantity,
            avg_cost_before: material.avg_cost,
            avg_cost_after: material.avg_cost,
            value_before: material.current_stock * material.avg_cost,
            value_after: (material.current_stock - item.quantity) * material.avg_cost
          }
        })
      }

      return { stockOut, expense }
    })

    return result
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi tạo phiếu xuất kho:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Lỗi khi tạo phiếu xuất kho. Vui lòng thử lại.' })
  }
})
