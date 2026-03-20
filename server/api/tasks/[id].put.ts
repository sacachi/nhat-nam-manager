import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { validateRequired, validateEnum, validateMinLength } from '~/server/utils/validate'
import { validateTaskHasSource, validateAssigneeActive, validateProjectExists } from '~/server/utils/business-rules'

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']
const VALID_TYPES = ['design', 'construction', 'inspection', 'other']

const formatTaskResponse = (task: any) => ({
  ...task,
  assignee_name: task.assignee?.name || null,
  project_name: task.project?.name || null,
  lead_name: task.lead?.customer_name || null,
  source_type: task.project ? 'project' : 'lead',
  source_id: task.project?.id || task.lead?.id || null,
  source_name: task.project?.name || task.lead?.customer_name || 'Chưa xác định'
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing task ID' })
  }

  const task = await prisma.projectTask.findUnique({
    where: { id }
  })

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  if (['Design', 'Construction'].includes(user.role)) {
    const isAssignee = task.assignee_id === user.id
    const isCreator = task.created_by === user.id
    if (!isAssignee && !isCreator) {
      throw createError({ statusCode: 403, statusMessage: 'Không có quyền sửa công việc này' })
    }
  }

  const updateData: any = {}

  if (body.title !== undefined) {
    validateRequired(body.title, 'Tiêu đề')
    validateMinLength(body.title, 3, 'Tiêu đề')
    updateData.title = body.title.trim()
  }

  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null
  }

  if (body.project_id !== undefined || body.lead_id !== undefined) {
    const nextProjectId = body.project_id === undefined ? task.project_id : body.project_id || null
    const nextLeadId = body.lead_id === undefined ? task.lead_id : body.lead_id || null

    if (!nextProjectId && !nextLeadId) {
      throw createError({ statusCode: 400, statusMessage: 'Công việc phải thuộc công trình hoặc lead' })
    }

    if (nextProjectId && nextLeadId) {
      throw createError({ statusCode: 400, statusMessage: 'Công việc chỉ được gắn với một công trình hoặc một lead' })
    }

    if (nextProjectId) {
      const project = await prisma.project.findUnique({ where: { id: nextProjectId } })
      if (!project) {
        throw createError({ statusCode: 400, statusMessage: 'Công trình không tồn tại' })
      }
    }

    if (nextLeadId) {
      const lead = await prisma.customerLead.findUnique({ where: { id: nextLeadId } })
      if (!lead) {
        throw createError({ statusCode: 400, statusMessage: 'Lead không tồn tại' })
      }
    }

    updateData.project_id = nextProjectId
    updateData.lead_id = nextLeadId
  }

  if (body.type !== undefined) {
    validateEnum(body.type, VALID_TYPES, 'Loại công việc')
    updateData.type = body.type
  }

  if (body.priority !== undefined && VALID_PRIORITIES.includes(body.priority)) {
    updateData.priority = body.priority
  }

  if (body.assignee_id !== undefined) {
    if (body.assignee_id) {
      const assignee = await prisma.user.findUnique({
        where: { id: body.assignee_id }
      })
      if (!assignee) {
        throw createError({ statusCode: 400, statusMessage: 'Người được gán không tồn tại' })
      }
    }
    updateData.assignee_id = body.assignee_id || null
  }

  if (body.deadline !== undefined) {
    updateData.deadline = body.deadline ? new Date(body.deadline) : null
  }

  if (body.status !== undefined && VALID_STATUSES.includes(body.status)) {
    updateData.status = body.status
    
    if (body.status === 'completed') {
      updateData.completed_at = new Date()
    } else {
      updateData.completed_at = null
    }
  }

  const updatedTask = await prisma.projectTask.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        select: { id: true, name: true }
      },
      lead: {
        select: { id: true, customer_name: true, status: true }
      },
      assignee: {
        select: { id: true, name: true }
      }
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'update',
      entity: 'project_task',
      entity_id: id,
      old_data: JSON.stringify(task),
      new_data: JSON.stringify(updatedTask)
    }
  })

  if (body.status === 'completed' && task.status !== 'completed') {
    await prisma.notification.create({
      data: {
        user_id: task.created_by,
        type: 'task_completed',
        title: 'Công việc đã hoàn thành',
        message: `Công việc "${task.title}" đã được hoàn thành`,
        link: '/my-tasks'
      }
    })
  }

  if (body.assignee_id !== undefined && body.assignee_id !== task.assignee_id && body.assignee_id && body.assignee_id !== user.id) {
    await prisma.notification.create({
      data: {
        user_id: body.assignee_id,
        type: 'task_assigned',
        title: 'Công việc được giao lại',
        message: `Bạn được giao công việc: ${updatedTask.title}`,
        link: '/my-tasks'
      }
    })
  }

  return formatTaskResponse(updatedTask)
})
