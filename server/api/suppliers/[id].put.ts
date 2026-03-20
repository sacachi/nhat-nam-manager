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
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền sửa nhà cung cấp' })
    }

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Nhà cung cấp không tồn tại' })
    }

    const body = await readBody(event)

    if (!body.name?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Tên nhà cung cấp là bắt buộc' })
    }

    if (body.code && body.code !== existing.code) {
      const codeExists = await prisma.supplier.findUnique({ where: { code: body.code } })
      if (codeExists) {
        throw createError({ statusCode: 400, statusMessage: 'Mã nhà cung cấp đã tồn tại' })
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name.trim(),
        code: body.code?.trim() || existing.code,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        tax_code: body.tax_code || null,
        note: body.note || null
      }
    })

    return supplier
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi cập nhật nhà cung cấp:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi cập nhật nhà cung cấp. Vui lòng thử lại.' })
  }
})
