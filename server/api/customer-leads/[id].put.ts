import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { SALE_ROLES } from '~/server/utils/roles'
import { validateRequired, validatePhone, validatePositiveNumber, validateEnum } from '~/server/utils/validate'
import { validateLeadCanAssignDesigner, validateAssigneeActive } from '~/server/utils/business-rules'

const VALID_STATUSES = ['pending', 'reviewed', 'assigned', 'approved', 'converted', 'rejected']
const VALID_DESIGN_STATUSES = ['not_assigned', 'assigned', 'in_progress', 'review_requested', 'approved', 'rejected']

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })
  }

  const oldLead = await prisma.customerLead.findUnique({ where: { id } })
  if (!oldLead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead không tồn tại' })
  }

  if (SALE_ROLES.includes(user.role) && oldLead.sale_user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền sửa lead này' })
  }

  if (SALE_ROLES.includes(user.role) && oldLead.status === 'converted') {
    throw createError({ statusCode: 400, statusMessage: 'Không thể sửa lead đã chuyển đổi' })
  }

  const updateData: any = {}

  if (body.customer_name !== undefined) {
    validateRequired(body.customer_name, 'Tên khách hàng')
    updateData.customer_name = body.customer_name
  }
  if (body.phone !== undefined) {
    validatePhone(body.phone)
    updateData.phone = body.phone
  }
  if (body.address !== undefined) {
    validateRequired(body.address, 'Địa chỉ')
    updateData.address = body.address
  }
  if (body.description !== undefined) {
    validateRequired(body.description, 'Mô tả')
    updateData.description = body.description
  }
  if (body.construction_value !== undefined) {
    validatePositiveNumber(body.construction_value, 'Giá trị công trình')
    updateData.construction_value = parseFloat(body.construction_value)
  }
  if (body.images !== undefined) updateData.images = body.images
  if (body.construction_categories !== undefined) {
    let categories: string[]
    try {
      categories = typeof body.construction_categories === 'string'
        ? JSON.parse(body.construction_categories)
        : body.construction_categories
    } catch {
      categories = [body.construction_categories]
    }
    updateData.construction_categories = JSON.stringify(categories)
  }
  if (body.construction_categories_other !== undefined) updateData.construction_categories_other = body.construction_categories_other
  if (body.design_submission_date !== undefined) {
    updateData.design_submission_date = body.design_submission_date ? new Date(body.design_submission_date) : null
  }

  if (body.designer_id !== undefined && user.role === 'Admin') {
    if (body.designer_id) {
      await validateLeadCanAssignDesigner(id)
      const designer = await validateAssigneeActive(body.designer_id)
      updateData.designer_id = body.designer_id
      updateData.design_status = 'assigned'
      
      if (body.designer_id !== oldLead.designer_id) {
        await prisma.notification.create({
          data: {
            user_id: body.designer_id,
            type: 'project_update',
            title: 'Bạn được gán thiết kế mới',
            message: `Bạn được gán thiết kế cho khách hàng: ${oldLead.customer_name}`,
            link: '/design-workspace'
          }
        })
      }
    } else {
      updateData.designer_id = null
      updateData.design_status = 'not_assigned'
    }
  }

  if (body.design_deadline !== undefined && user.role === 'Admin') {
    updateData.design_deadline = body.design_deadline ? new Date(body.design_deadline) : null
  }

  if (body.design_status !== undefined && user.role === 'Admin') {
    validateEnum(body.design_status, VALID_DESIGN_STATUSES, 'Trạng thái thiết kế')
    updateData.design_status = body.design_status
  }

  if (body.design_files !== undefined && user.role === 'Admin') {
    updateData.design_files = body.design_files
  }

  if (body.design_note !== undefined) {
    updateData.design_note = body.design_note
  }

  if (body.status !== undefined && user.role === 'Admin') {
    validateEnum(body.status, VALID_STATUSES, 'Trạng thái')
    updateData.status = body.status
  }
  if (body.note !== undefined && user.role === 'Admin') {
    updateData.note = body.note
  }

  const lead = await prisma.customerLead.update({
    where: { id },
    data: updateData,
    include: {
      sale_user: {
        select: { id: true, name: true }
      }
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'update',
      entity: 'customer_lead',
      entity_id: id,
      old_data: JSON.stringify(oldLead),
      new_data: JSON.stringify(lead)
    }
  })

  return {
    ...lead,
    sale_name: lead.sale_user.name
  }
})
