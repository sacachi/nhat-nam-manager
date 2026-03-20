import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const isAdmin = user.role === 'Admin'
  const userId = user.id

  // Task filter: non-admin users only see their own tasks
  const taskWhere = isAdmin ? {} : { assignee_id: userId }

  const projectsCount = isAdmin
    ? await prisma.project.count()
    : await prisma.project.count({
        where: {
          tasks: { some: { assignee_id: userId } }
        }
      })

  const canViewFinance = ['Admin', 'Sale'].includes(user.role)
  
  const receipts = canViewFinance
    ? await prisma.receipt.aggregate({ _sum: { amount: true } })
    : { _sum: { amount: 0 } }

  const expenses = canViewFinance
    ? await prisma.expense.aggregate({ _sum: { amount: true } })
    : { _sum: { amount: 0 } }

  const tasksTotal = await prisma.projectTask.count({ where: taskWhere })
  const tasksPending = await prisma.projectTask.count({ where: { ...taskWhere, status: 'pending' } })
  const tasksInProgress = await prisma.projectTask.count({ where: { ...taskWhere, status: 'in_progress' } })
  const tasksCompleted = await prisma.projectTask.count({ where: { ...taskWhere, status: 'completed' } })

  const now = new Date()
  const overdueTasks = await prisma.projectTask.findMany({
    where: {
      ...taskWhere,
      deadline: { lt: now },
      status: { not: 'completed' }
    },
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true } }
    },
    take: 5,
    orderBy: { deadline: 'asc' }
  })

  // Sale users: also get their leads stats
  let leadsStats = null
  if (user.role === 'Sale') {
    const totalLeads = await prisma.customerLead.count({ where: { sale_user_id: userId } })
    const convertedLeads = await prisma.customerLead.count({ where: { sale_user_id: userId, status: 'converted' } })
    const pendingLeads = await prisma.customerLead.count({ where: { sale_user_id: userId, status: 'pending' } })
    leadsStats = { total: totalLeads, converted: convertedLeads, pending: pendingLeads }
  }

  // Design users: their design assignments
  let designStats = null
  if (user.role === 'Design') {
    const assignedDesigns = await prisma.customerLead.count({ where: { designer_id: userId } })
    const inProgressDesigns = await prisma.customerLead.count({ where: { designer_id: userId, design_status: 'in_progress' } })
    const completedDesigns = await prisma.customerLead.count({ where: { designer_id: userId, design_status: 'approved' } })
    designStats = { assigned: assignedDesigns, inProgress: inProgressDesigns, completed: completedDesigns }
  }

  const recentLogs = isAdmin
    ? await prisma.activityLog.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 5
      })
    : await prisma.activityLog.findMany({
        where: { user_id: userId },
        include: { user: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 5
      })

  // Inventory stats for Admin and Accounting
  let inventoryStats = null
  if (['Admin', 'Accounting'].includes(user.role)) {
    const materials = await prisma.material.findMany({
      select: { id: true, name: true, current_stock: true, min_stock_level: true, unit: true, stock_value: true }
    })
    const totalMaterials = materials.length
    const totalStockValue = materials.reduce((sum, m) => sum + (m.stock_value || 0), 0)
    const lowStockMaterials = materials.filter(m => m.current_stock <= m.min_stock_level)
    inventoryStats = {
      totalMaterials,
      totalStockValue,
      lowStockCount: lowStockMaterials.length,
      lowStockMaterials: lowStockMaterials.slice(0, 5).map(m => ({
        id: m.id,
        name: m.name,
        current_stock: m.current_stock,
        min_stock_level: m.min_stock_level,
        unit: m.unit
      }))
    }
  }

  // Supplier debt for Admin and Accounting
  let supplierDebtStats = null
  if (['Admin', 'Accounting'].includes(user.role)) {
    const suppliers = await prisma.supplier.findMany({ select: { debt: true } })
    const totalDebt = suppliers.reduce((sum, s) => sum + (s.debt || 0), 0)
    const suppliersWithDebt = suppliers.filter(s => s.debt > 0).length
    supplierDebtStats = {
      totalDebt,
      suppliersWithDebt,
      suppliersCount: suppliers.length
    }
  }

  return {
    role: user.role,
    projects: projectsCount,
    totalReceived: receipts._sum.amount || 0,
    totalSpent: expenses._sum.amount || 0,
    leadsStats,
    designStats,
    tasks: {
      total: tasksTotal,
      pending: tasksPending,
      inProgress: tasksInProgress,
      completed: tasksCompleted
    },
    overdueTasks: overdueTasks.map(t => ({
      id: t.id,
      title: t.title,
      project_name: t.project?.name,
      assignee_name: t.assignee?.name,
      deadline: t.deadline
    })),
    recentLogs: recentLogs.map(({ user, ...log }) => ({
      ...log,
      user_name: user?.name || log.user_id
    })),
    inventoryStats,
    supplierDebtStats
  }
})
