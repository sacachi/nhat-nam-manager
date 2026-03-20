import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  
  const users = await prisma.user.findMany({
    where: { role: { in: ['Sale', 'Design', 'Construction'] } }
  })

  const tasks = await prisma.projectTask.findMany()
  const leads = await prisma.customerLead.findMany()
  const projects = await prisma.project.findMany()

  const teamReport = users.map(user => {
    const userTasks = tasks.filter(t => t.assignee_id === user.id)
    const completedTasks = userTasks.filter(t => t.status === 'completed')
    const overdueTasks = userTasks.filter(t => {
      if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false
      return new Date(t.deadline) < new Date()
    })
    const pendingTasks = userTasks.filter(t => t.status === 'pending')
    const inProgressTasks = userTasks.filter(t => t.status === 'in_progress')

    let leadsHandled = 0
    let leadsConverted = 0
    let projectsCreated = 0

    if (user.role === 'Sale') {
      leadsHandled = leads.filter(l => l.sale_user_id === user.id).length
      leadsConverted = leads.filter(l => l.sale_user_id === user.id && l.status === 'converted').length
      projectsCreated = projects.filter(p => {
        const lead = leads.find(l => l.sale_user_id === user.id && l.status === 'converted')
        return lead !== undefined
      }).length
    }

    const taskCompletionRate = userTasks.length > 0 
      ? Math.round((completedTasks.length / userTasks.length) * 100) 
      : 0

    const avgTasksPerDay = userTasks.length / 30

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      tasks: {
        total: userTasks.length,
        completed: completedTasks.length,
        overdue: overdueTasks.length,
        pending: pendingTasks.length,
        inProgress: inProgressTasks.length,
        completionRate: taskCompletionRate
      },
      leads: user.role === 'Sale' ? {
        handled: leadsHandled,
        converted: leadsConverted,
        conversionRate: leadsHandled > 0 ? Math.round((leadsConverted / leadsHandled) * 100) : 0
      } : null,
      projects: user.role === 'Sale' ? projectsCreated : null,
      avgTasksPerDay: Math.round(avgTasksPerDay * 10) / 10
    }
  })

  const teamSummary = {
    Sale: {
      total: teamReport.filter(u => u.role === 'Sale').length,
      totalLeads: teamReport.reduce((sum, u) => sum + (u.leads?.handled || 0), 0),
      totalConverted: teamReport.reduce((sum, u) => sum + (u.leads?.converted || 0), 0),
      avgCompletionRate: teamReport.filter(u => u.role === 'Sale').length > 0
        ? Math.round(teamReport.filter(u => u.role === 'Sale').reduce((sum, u) => sum + u.tasks.completionRate, 0) / teamReport.filter(u => u.role === 'Sale').length)
        : 0
    },
    Design: {
      total: teamReport.filter(u => u.role === 'Design').length,
      avgCompletionRate: teamReport.filter(u => u.role === 'Design').length > 0
        ? Math.round(teamReport.filter(u => u.role === 'Design').reduce((sum, u) => sum + u.tasks.completionRate, 0) / teamReport.filter(u => u.role === 'Design').length)
        : 0,
      totalTasks: teamReport.filter(u => u.role === 'Design').reduce((sum, u) => sum + u.tasks.total, 0),
      totalOverdue: teamReport.filter(u => u.role === 'Design').reduce((sum, u) => sum + u.tasks.overdue, 0)
    },
    Construction: {
      total: teamReport.filter(u => u.role === 'Construction').length,
      avgCompletionRate: teamReport.filter(u => u.role === 'Construction').length > 0
        ? Math.round(teamReport.filter(u => u.role === 'Construction').reduce((sum, u) => sum + u.tasks.completionRate, 0) / teamReport.filter(u => u.role === 'Construction').length)
        : 0,
      totalTasks: teamReport.filter(u => u.role === 'Construction').reduce((sum, u) => sum + u.tasks.total, 0),
      totalOverdue: teamReport.filter(u => u.role === 'Construction').reduce((sum, u) => sum + u.tasks.overdue, 0)
    }
  }

  return { teamReport, teamSummary }
})
