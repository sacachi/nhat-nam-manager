import prisma from './prisma'

export interface SaleMetrics {
  leads_created: number
  leads_converted: number
  conversion_rate: number
  total_contract_value: number
  avg_days_to_convert: number
  receipts_count: number
  activities_count: number
}

export interface DesignMetrics {
  tasks_assigned: number
  tasks_completed: number
  tasks_on_time: number
  on_time_rate: number
  avg_days_per_task: number
  revision_count: number
  overdue_tasks: number
}

export interface ConstructionMetrics {
  tasks_assigned: number
  tasks_completed: number
  tasks_on_time: number
  on_time_rate: number
  avg_days_per_task: number
  overdue_tasks: number
  expenses_logged: number
}

export interface PerformanceScore {
  score: number
  grade: string
  gradeColor: string
}

export function getGrade(score: number): PerformanceScore {
  if (score >= 90) return { score, grade: 'A+', gradeColor: 'success' }
  if (score >= 85) return { score, grade: 'A', gradeColor: 'success' }
  if (score >= 75) return { score, grade: 'B+', gradeColor: 'info' }
  if (score >= 65) return { score, grade: 'B', gradeColor: 'info' }
  if (score >= 50) return { score, grade: 'C', gradeColor: 'warn' }
  return { score, grade: 'D', gradeColor: 'danger' }
}

export function calcTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous
  if (diff > 5) return 'up'
  if (diff < -5) return 'down'
  return 'stable'
}

export function getMonthsBetween(from: Date, to: Date): number {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  return Math.max(1, months)
}

export function getPreviousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const days = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  const prevTo = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - days)
  return { from: prevFrom, to: prevTo }
}

export async function calcSaleMetrics(userId: string, from: Date, to: Date): Promise<SaleMetrics> {
  const leads = await prisma.customerLead.findMany({
    where: {
      sale_user_id: userId,
      created_at: { gte: from, lte: to }
    }
  })

  const leads_created = leads.length
  const leads_converted = leads.filter(l => l.status === 'converted').length
  const conversion_rate = leads_created > 0 ? (leads_converted / leads_created) * 100 : 0

  const convertedLeads = leads.filter(l => l.status === 'converted')
  let total_contract_value = 0
  let totalDays = 0
  
  for (const lead of convertedLeads) {
    total_contract_value += lead.construction_value
    const days = Math.floor((new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
    totalDays += days
  }
  
  const avg_days_to_convert = leads_converted > 0 ? totalDays / leads_converted : 0

  const receipts = await prisma.receipt.findMany({
    where: {
      created_by: userId,
      created_at: { gte: from, lte: to }
    }
  })

  const activities = await prisma.activityLog.count({
    where: {
      user_id: userId,
      created_at: { gte: from, lte: to }
    }
  })

  return {
    leads_created,
    leads_converted,
    conversion_rate,
    total_contract_value,
    avg_days_to_convert,
    receipts_count: receipts.length,
    activities_count: activities
  }
}

export async function calcDesignMetrics(userId: string, from: Date, to: Date): Promise<DesignMetrics> {
  const tasks = await prisma.projectTask.findMany({
    where: {
      assignee_id: userId,
      created_at: { gte: from, lte: to }
    }
  })

  const tasks_assigned = tasks.length
  const tasks_completed = tasks.filter(t => t.status === 'completed').length
  const now = new Date()

  let tasks_on_time = 0
  let overdue_tasks = 0
  let totalDays = 0

  for (const task of tasks) {
    if (task.status === 'completed' && task.deadline && task.completed_at) {
      if (new Date(task.completed_at) <= new Date(task.deadline)) {
        tasks_on_time++
      }
      const days = Math.floor((new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24))
      totalDays += days
    }
    if (task.deadline && new Date(task.deadline) < now && task.status !== 'completed') {
      overdue_tasks++
    }
  }

  const on_time_rate = tasks_completed > 0 ? (tasks_on_time / tasks_completed) * 100 : 0
  const avg_days_per_task = tasks_completed > 0 ? totalDays / tasks_completed : 0

  const leads = await prisma.customerLead.findMany({
    where: {
      designer_id: userId,
      updated_at: { gte: from, lte: to },
      design_status: 'rejected'
    }
  })

  return {
    tasks_assigned,
    tasks_completed,
    tasks_on_time,
    on_time_rate,
    avg_days_per_task,
    revision_count: leads.length,
    overdue_tasks
  }
}

export async function calcConstructionMetrics(userId: string, from: Date, to: Date): Promise<ConstructionMetrics> {
  const tasks = await prisma.projectTask.findMany({
    where: {
      assignee_id: userId,
      created_at: { gte: from, lte: to }
    }
  })

  const tasks_assigned = tasks.length
  const tasks_completed = tasks.filter(t => t.status === 'completed').length
  const now = new Date()

  let tasks_on_time = 0
  let overdue_tasks = 0
  let totalDays = 0

  for (const task of tasks) {
    if (task.status === 'completed' && task.deadline && task.completed_at) {
      if (new Date(task.completed_at) <= new Date(task.deadline)) {
        tasks_on_time++
      }
      const days = Math.floor((new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24))
      totalDays += days
    }
    if (task.deadline && new Date(task.deadline) < now && task.status !== 'completed') {
      overdue_tasks++
    }
  }

  const on_time_rate = tasks_completed > 0 ? (tasks_on_time / tasks_completed) * 100 : 0
  const avg_days_per_task = tasks_completed > 0 ? totalDays / tasks_completed : 0

  const expenses = await prisma.expense.count({
    where: {
      created_by: userId,
      created_at: { gte: from, lte: to }
    }
  })

  return {
    tasks_assigned,
    tasks_completed,
    tasks_on_time,
    on_time_rate,
    avg_days_per_task,
    overdue_tasks,
    expenses_logged: expenses
  }
}

export function calcSaleScore(metrics: SaleMetrics): number {
  let score = 0
  
  if (metrics.leads_created > 0) {
    score += Math.min(25, metrics.leads_created * 3)
  }
  
  if (metrics.conversion_rate > 0) {
    score += Math.min(30, metrics.conversion_rate * 0.8)
  }
  
  if (metrics.total_contract_value > 0) {
    const valueScore = Math.min(25, (metrics.total_contract_value / 100000000) * 5)
    score += valueScore
  }
  
  if (metrics.avg_days_to_convert > 0 && metrics.avg_days_to_convert <= 30) {
    score += Math.max(0, 20 - (metrics.avg_days_to_convert * 0.5))
  } else if (metrics.avg_days_to_convert === 0 && metrics.leads_converted > 0) {
    score += 20
  }

  score += Math.min(10, metrics.receipts_count * 2)
  score += Math.min(5, metrics.activities_count * 0.5)
  
  return Math.round(Math.min(100, score))
}

export function calcDesignScore(metrics: DesignMetrics): number {
  let score = 0
  
  if (metrics.tasks_assigned > 0) {
    const completionRate = (metrics.tasks_completed / metrics.tasks_assigned) * 100
    score += Math.min(30, completionRate * 0.3)
  }
  
  if (metrics.on_time_rate > 0) {
    score += Math.min(30, metrics.on_time_rate * 0.3)
  }
  
  score += Math.min(20, metrics.tasks_completed * 4)
  
  if (metrics.revision_count === 0 && metrics.tasks_completed > 0) {
    score += 10
  } else if (metrics.revision_count > 0) {
    score += Math.max(0, 10 - metrics.revision_count * 2)
  }
  
  if (metrics.overdue_tasks === 0) {
    score += 10
  } else {
    score += Math.max(0, 10 - metrics.overdue_tasks * 3)
  }
  
  return Math.round(Math.min(100, score))
}

export function calcConstructionScore(metrics: ConstructionMetrics): number {
  let score = 0
  
  if (metrics.tasks_assigned > 0) {
    const completionRate = (metrics.tasks_completed / metrics.tasks_assigned) * 100
    score += Math.min(30, completionRate * 0.3)
  }
  
  if (metrics.on_time_rate > 0) {
    score += Math.min(35, metrics.on_time_rate * 0.35)
  }
  
  score += Math.min(20, metrics.tasks_completed * 3)
  
  if (metrics.overdue_tasks === 0) {
    score += 15
  } else {
    score += Math.max(0, 15 - metrics.overdue_tasks * 5)
  }
  
  return Math.round(Math.min(100, score))
}
