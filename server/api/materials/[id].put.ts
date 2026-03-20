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
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền sửa vật tư' })
    }

    const existing = await prisma.material.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Vật tư không tồn tại' })
    }

    const body = await readBody(event)

    const material = await prisma.material.update({
      where: { id },
      data: {
        code: body.code !== undefined ? body.code : existing.code,
        name: body.name !== undefined ? body.name : existing.name,
        unit: body.unit !== undefined ? body.unit : existing.unit,
        standard_price: body.standard_price !== undefined ? body.standard_price : existing.standard_price,
        min_stock_level: body.min_stock_level !== undefined ? body.min_stock_level : existing.min_stock_level,
        description: body.description !== undefined ? body.description : existing.description,
        status: body.status !== undefined ? body.status : existing.status
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'update',
        entity: 'material',
        entity_id: id,
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(material)
      }
    })

    return material
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi cập nhật vật tư:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi cập nhật vật tư. Vui lòng thử lại.' })
  }
})
