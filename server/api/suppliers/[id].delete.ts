import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
    }

    if (user.role !== 'Admin') {
      throw createError({ statusCode: 403, statusMessage: 'Chỉ Admin mới có quyền xóa nhà cung cấp' })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stockIns: true,
            supplierPayments: true
          }
        }
      }
    })

    if (!supplier) {
      throw createError({ statusCode: 404, statusMessage: 'Nhà cung cấp không tồn tại' })
    }

    if (supplier._count.stockIns > 0 || supplier._count.supplierPayments > 0) {
      throw createError({ statusCode: 400, statusMessage: 'Không thể xóa nhà cung cấp đã có giao dịch' })
    }

    await prisma.supplier.delete({ where: { id } })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Lỗi khi xóa nhà cung cấp:', error)
    throw createError({ statusCode: 500, statusMessage: 'Lỗi khi xóa nhà cung cấp. Vui lòng thử lại.' })
  }
})
