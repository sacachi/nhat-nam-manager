import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo vật tư' })
    }

    const body = await readBody(event)

    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Tên vật tư là bắt buộc' })
    }
    if (!body.unit) {
      throw createError({ statusCode: 400, statusMessage: 'Đơn vị tính là bắt buộc' })
    }

    let code = body.code?.trim()
    if (!code) {
      const count = await prisma.material.count()
      code = `VT${String(count + 1).padStart(4, '0')}`
      while (await prisma.material.findUnique({ where: { code } })) {
        code = `VT${String(count + 2).padStart(4, '0')}`
      }
    } else {
      const existing = await prisma.material.findUnique({ where: { code } })
      if (existing) {
        throw createError({ statusCode: 400, statusMessage: 'Mã vật tư đã tồn tại' })
      }
    }

    const material = await prisma.material.create({
      data: {
        code,
        name: body.name,
        unit: body.unit,
        standard_price: body.standard_price || 0,
        min_stock_level: body.min_stock_level || 0,
        description: body.description,
        status: body.status || 'active'
      }
    })

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'create',
        entity: 'material',
        entity_id: material.id,
        new_data: JSON.stringify(material)
      }
    })

    return material
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi tạo vật tư:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi tạo vật tư. Vui lòng thử lại.' })
  }
})
