import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    
    if (!['Admin', 'Accounting'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo nhà cung cấp' })
    }

    const body = await readBody(event)

    if (!body.name?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Tên nhà cung cấp là bắt buộc' })
    }

    let code = body.code?.trim()
    if (!code) {
      const count = await prisma.supplier.count()
      code = `NCC${String(count + 1).padStart(4, '0')}`
      while (await prisma.supplier.findUnique({ where: { code } })) {
        code = `NCC${String(count + 2).padStart(4, '0')}`
      }
    } else {
      const existing = await prisma.supplier.findUnique({ where: { code } })
      if (existing) {
        throw createError({ statusCode: 400, statusMessage: 'Mã nhà cung cấp đã tồn tại' })
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        code,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        tax_code: body.tax_code || null,
        note: body.note || null,
        status: 'active'
      }
    })

    return supplier
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi tạo nhà cung cấp:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi tạo nhà cung cấp. Vui lòng thử lại.' })
  }
})
