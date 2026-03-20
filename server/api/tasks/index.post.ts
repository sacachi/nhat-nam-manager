import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { validateRequired, validateEnum, validateMinLength } from '~/server/utils/validate'
import { validateTaskHasSource, validateAssigneeActive, validateProjectExists, validateCustomerExists } from '~/server/utils/business-rules'

const VALID_TYPES = ['design', 'construction', 'inspection', 'other']
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

const formatTaskResponse = (task: any) => ({
  ...task,
  assignee_name: task.assignee?.name || null,
  project_name: task.project?.name || null,
  lead_name: task.lead?.customer_name || null,
  source_type: task.project ? 'project' : 'lead',
  source_id: task.project?.id || task.lead?.id || null,
  source_name: task.project?.name || task.lead?.customer_name || 'Chưa xác định',
  total_expense: task.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBody(event)

  if (!['Admin', 'Sale', 'Design', 'Construction'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền tạo công việc' })
  }

  const { project_id, lead_id, title, description, type, priority, status, assignee_id, deadline } = body

  validateRequired(title, 'Tiêu đề công việc')
  validateMinLength(title, 3, 'Tiêu đề công việc')
  
  if (type) validateEnum(type, VALID_TYPES, 'Loại công việc')
  if (priority) validateEnum(priority, VALID_PRIORITIES, 'Mức ưu tiên')
  if (status) validateEnum(status, VALID_STATUSES, 'Trạng thái')
  
  await validateTaskHasSource({ project_id, lead_id })
  
  if (project_id) {
    await validateProjectExists(project_id)
  }

  if (lead_id) {
    const lead = await prisma.customerLead.findUnique({ where: { id: lead_id } })
    if (!lead) {
      throw createError({ statusCode: 404, statusMessage: 'Lead không tồn tại' })
    }
  }

  if (assignee_id) {
    await validateAssigneeActive(assignee_id)
  }

  const task = await prisma.projectTask.create({
    data: {
      project_id: project_id || null,
      lead_id: lead_id || null,
      title: title.trim(),
      description: description?.trim() || null,
      type: VALID_TYPES.includes(type) ? type : 'other',
      priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
      status: VALID_STATUSES.includes(status) ? status : 'pending',
      completed_at: status === 'completed' ? new Date() : null,
      assignee_id: assignee_id || null,
      deadline: deadline ? new Date(deadline) : null,
      created_by: user.id
    },
    include: {
      project: {
        select: { id: true, name: true }
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
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'create',
      entity: 'project_task',
      entity_id: task.id,
      new_data: JSON.stringify(task)
    }
  })

  if (assignee_id && assignee_id !== user.id) {
    await prisma.notification.create({
      data: {
        user_id: assignee_id,
        type: 'task_assigned',
        title: 'Công việc mới được giao',
        message: `Bạn được giao công việc: ${title}`,
        link: '/my-tasks'
      }
    })
  }

  return formatTaskResponse(task)
})
