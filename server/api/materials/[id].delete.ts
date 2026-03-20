import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
    }

    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền xóa vật tư' })
    }

    const existing = await prisma.material.findUnique({ 
      where: { id },
      include: {
        stockInItems: true,
        stockOutItems: true
      }
    })

    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Vật tư không tồn tại' })
    }

    if (existing.current_stock > 0) {
      throw createError({ statusCode: 400, statusMessage: 'Không thể xóa vật tư có tồn kho lớn hơn 0' })
    }

    if (existing.stockInItems.length > 0 || existing.stockOutItems.length > 0) {
      throw createError({ statusCode: 400, statusMessage: 'Không thể xóa vật tư đã có giao dịch' })
    }

    await prisma.material.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'delete',
        entity: 'material',
        entity_id: id,
        old_data: JSON.stringify(existing)
      }
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi xóa vật tư:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi xóa vật tư. Vui lòng thử lại.' })
  }
})
