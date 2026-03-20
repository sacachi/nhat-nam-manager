import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!['Admin', 'Accounting'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền xem báo cáo' })
  }

  const query = getQuery(event)
  const category = query.category as string | undefined

  const materials = await prisma.material.findMany({
    where: category ? { description: { contains: category } } : undefined,
    orderBy: { name: 'asc' }
  })

  const totalMaterials = materials.length
  const totalStockValue = materials.reduce((sum, m) => sum + (m.stock_value || 0), 0)
  const totalStockQuantity = materials.reduce((sum, m) => sum + (m.current_stock || 0), 0)

  const lowStockItems = materials.filter(m => m.current_stock <= m.min_stock_level)
  const outOfStockItems = materials.filter(m => m.current_stock === 0)

  const materialsWithStats = await Promise.all(materials.map(async (m) => {
    const stockIns = await prisma.stockInItem.aggregate({
      where: { material_id: m.id },
      _sum: { quantity: true },
      _count: true
    })

    const stockOuts = await prisma.stockOutItem.aggregate({
      where: { material_id: m.id },
      _sum: { quantity: true },
      _count: true
    })

    return {
      id: m.id,
      code: m.code,
      name: m.name,
      unit: m.unit,
      description: m.description,
      current_stock: m.current_stock,
      min_stock_level: m.min_stock_level,
      avg_cost: m.avg_cost,
      stock_value: m.stock_value,
      standard_price: m.standard_price,
      total_imported: stockIns._sum.quantity || 0,
      import_count: stockIns._count || 0,
      total_exported: stockOuts._sum.quantity || 0,
      export_count: stockOuts._count || 0,
      is_low_stock: m.current_stock <= m.min_stock_level,
      is_out_of_stock: m.current_stock === 0
    }
  }))

  const categoryStats = [
    { name: 'Gỗ MDF', count: materials.filter(m => m.name.includes('MDF')).length },
    { name: 'Gỗ Plywood', count: materials.filter(m => m.name.includes('Plywood') || m.name.includes('HDF')).length },
    { name: 'Lamington', count: materials.filter(m => m.name.includes('Lamington')).length },
    { name: 'Phụ kiện', count: materials.filter(m => ['Ray', 'Bản lề', 'Tay nắm'].some(k => m.name.includes(k))).length },
    { name: 'Sơn', count: materials.filter(m => m.name.includes('Sơn')).length },
    { name: 'Khác', count: materials.filter(m => 
      !m.name.includes('MDF') && 
      !m.name.includes('Plywood') && 
      !m.name.includes('HDF') && 
      !m.name.includes('Lamington') &&
      !['Ray', 'Bản lề', 'Tay nắm'].some(k => m.name.includes(k)) &&
      !m.name.includes('Sơn')
    ).length }
  ]

  return {
    summary: {
      totalMaterials,
      totalStockValue,
      totalStockQuantity,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length
    },
    materials: materialsWithStats,
    lowStockItems: materialsWithStats.filter(m => m.is_low_stock),
    outOfStockItems: materialsWithStats.filter(m => m.is_out_of_stock),
    categoryStats
  }
})
