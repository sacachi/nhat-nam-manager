import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { validateLeadCanConvert } from '~/server/utils/business-rules'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  }

  if (!['Admin', 'Sale'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền chuyển đổi' })
  }

  const lead = await validateLeadCanConvert(id)

  if (user.role === 'Sale' && lead.sale_user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền chuyển đổi lead này' })
  }

  if (user.role === 'Sale' && lead.design_status !== 'approved') {
    throw createError({ statusCode: 400, statusMessage: 'Thiết kế chưa được duyệt, không thể chuyển đổi' })
  }

  let customer = await prisma.customer.findFirst({
    where: { phone: lead.phone }
  })

  let isNewCustomer = false
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: lead.customer_name,
        phone: lead.phone,
        address: lead.address,
        note: `Chuyển đổi từ Lead #${lead.id}`
      }
    })
    isNewCustomer = true

    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'create',
        entity: 'customer',
        entity_id: customer.id,
        new_data: JSON.stringify(customer)
      }
    })
  }

  let categories: string[] = []
  try {
    categories = JSON.parse(lead.construction_categories)
  } catch {
    categories = [lead.construction_categories]
  }

  let projectNote = `Chuyển từ Lead #${lead.id}`
  
  if (lead.design_files) {
    projectNote += `\nThiết kế: ${lead.design_files}`
  }

  if (lead.design_note) {
    projectNote += `\nGhi chú TK: ${lead.design_note}`
  }

  const project = await prisma.project.create({
    data: {
      name: `${lead.customer_name} — ${categories.join(', ')}`,
      customer_id: customer.id,
      contract_value: lead.construction_value,
      status: 'đang thi công',
      start_date: lead.design_deadline || new Date(),
      note: projectNote
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'create',
      entity: 'project',
      entity_id: project.id,
      new_data: JSON.stringify(project)
    }
  })

  const updatedLead = await prisma.customerLead.update({
    where: { id },
    data: {
      status: 'converted'
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'update',
      entity: 'customer_lead',
      entity_id: lead.id,
      old_data: JSON.stringify(lead),
      new_data: JSON.stringify(updatedLead)
    }
  })

  return {
    customer,
    project,
    lead: updatedLead,
    isNewCustomer
  }
})
