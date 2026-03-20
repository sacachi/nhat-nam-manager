import { createError } from 'h3'
import prisma from './prisma'

export const validateLeadCanAssignDesigner = async (leadId: string) => {
  const lead = await prisma.customerLead.findUnique({
    where: { id: leadId }
  })
  
  if (!lead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead không tồn tại' })
  }
  
  if (lead.status === 'converted') {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Không thể gán designer cho lead đã chuyển đổi' 
    })
  }
  
  if (lead.status === 'rejected') {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Không thể gán designer cho lead đã từ chối' 
    })
  }
  
  return lead
}

export const validateLeadCanConvert = async (leadId: string) => {
  const lead = await prisma.customerLead.findUnique({
    where: { id: leadId }
  })
  
  if (!lead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead không tồn tại' })
  }
  
  if (lead.status === 'converted') {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Lead đã được chuyển đổi trước đó' 
    })
  }
  
  if (lead.status === 'rejected') {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Không thể chuyển đổi lead đã từ chối' 
    })
  }
  
  if (!lead.designer_id) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Lead phải có designer trước khi chuyển đổi' 
    })
  }
  
  return lead
}

export const validateTaskHasSource = async (taskData: { project_id?: string | null; lead_id?: string | null }) => {
  if (!taskData.project_id && !taskData.lead_id) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Task phải thuộc một Project hoặc một Lead' 
    })
  }
  
  if (taskData.project_id && taskData.lead_id) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Task không thể thuộc đồng thời Project và Lead' 
    })
  }
}

export const validateExpenseTaskProjectMatch = async (expenseData: { project_id: string; task_id?: string | null }) => {
  if (!expenseData.task_id) return
  
  const task = await prisma.projectTask.findUnique({
    where: { id: expenseData.task_id }
  })
  
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task không tồn tại' })
  }
  
  if (task.project_id && task.project_id !== expenseData.project_id) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Task không thuộc Project này' 
    })
  }
}

export const validateAssigneeActive = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Người dùng không tồn tại' })
  }
  
  return user
}

export const validateProjectExists = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })
  
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Công trình không tồn tại' })
  }
  
  return project
}

export const validateCustomerExists = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })
  
  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: 'Khách hàng không tồn tại' })
  }
  
  return customer
}

export const validateUserExists = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Người dùng không tồn tại' })
  }
  
  return user
}

export const validateTaskExists = async (taskId: string) => {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId }
  })
  
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task không tồn tại' })
  }
  
  return task
}
