import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'

const formatTaskResponse = (task: any) => ({
  ...task,
  assignee_name: task.assignee?.name || null,
  project_name: task.project?.name || null,
  lead_name: task.lead?.customer_name || null,
  source_type: task.project ? 'project' : 'lead',
  source_id: task.project?.id || task.lead?.id || null,
  source_name: task.project?.name || task.lead?.customer_name || 'Chưa xác định',
  total_expense: task.expenses.reduce((s: number, e: any) => s + e.amount, 0)
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)

  if (user.role === 'Construction' || user.role === 'Design') {
    const tasks = await prisma.projectTask.findMany({
      where: { assignee_id: user.id },
      include: {
        project: {
          select: { id: true, name: true, status: true }
        },
        lead: {
          select: { id: true, customer_name: true, status: true }
        },
        assignee: {
          select: { id: true, name: true }
        },
        expenses: {
          select: { id: true, amount: true, type: true, note: true, date: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' }
      ]
    })

    return tasks.map(formatTaskResponse)
  }

  const where: any = {}
  
  if (query.project_id) {
    where.project_id = query.project_id as string
  }
  
  if (query.status) {
    where.status = query.status as string
  }
  
  if (query.assignee_id) {
    where.assignee_id = query.assignee_id as string
  }
  
  if (query.priority) {
    where.priority = query.priority as string
  }

  if (query.lead_id) {
    where.lead_id = query.lead_id as string
  }

  if (query.source_type === 'project') {
    where.project_id = { not: null }
  }

  if (query.source_type === 'lead') {
    where.lead_id = { not: null }
  }

  const tasks = await prisma.projectTask.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true, status: true }
      },
      lead: {
        select: { id: true, customer_name: true, status: true }
      },
      assignee: {
        select: { id: true, name: true }
      },
      expenses: {
        select: { id: true, amount: true, type: true, note: true, date: true }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { deadline: 'asc' }
    ]
  })

  return tasks.map(formatTaskResponse)
})
