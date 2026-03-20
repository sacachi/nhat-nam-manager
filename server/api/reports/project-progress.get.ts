import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  
  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, role: true } }
        }
      },
      expenses: true
    }
  })

  const report = projects.map(project => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length
    const overdueTasks = project.tasks.filter(t => {
      if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false
      return new Date(t.deadline) < new Date()
    }).length
    const pendingTasks = project.tasks.filter(t => t.status === 'pending').length
    const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress').length

    const totalExpense = project.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    
    const expensesByType = project.expenses.reduce((acc, e) => {
      const type = e.type || 'other'
      acc[type] = (acc[type] || 0) + (e.amount || 0)
      return acc
    }, {})

    const tasksByAssignee = project.tasks.reduce((acc, t) => {
      if (t.assignee) {
        if (!acc[t.assignee.name]) {
          acc[t.assignee.name] = { 
            total: 0, 
            completed: 0, 
            overdue: 0,
            role: t.assignee.role 
          }
        }
        acc[t.assignee.name].total++
        if (t.status === 'completed') acc[t.assignee.name].completed++
        if (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed') {
          acc[t.assignee.name].overdue++
        }
      }
      return acc
    }, {})

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalExpense,
      expensesByType,
      tasksByAssignee
    }
  })

  return report
})
