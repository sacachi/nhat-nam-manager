import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { requireSaleOrAdmin } from '~/server/utils/roles'
import { validatePhone, validatePositiveNumber } from '~/server/utils/validate'

export default defineEventHandler(async (event) => {
  const user = requireSaleOrAdmin(event)
  const body = await readBody(event)

  const requiredFields = ['customer_name', 'phone', 'address', 'construction_categories', 'description', 'construction_value']
  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({ statusCode: 400, statusMessage: `Trường ${field} là bắt buộc` })
    }
  }

  validatePhone(body.phone)

  const constructionValue = parseFloat(body.construction_value)
  validatePositiveNumber(constructionValue, 'Giá trị công trình')

  let categories: string[] = []
  try {
    categories = typeof body.construction_categories === 'string' 
      ? JSON.parse(body.construction_categories) 
      : body.construction_categories
  } catch {
    categories = [body.construction_categories]
  }

  const lead = await prisma.customerLead.create({
    data: {
      sale_user_id: user.id,
      customer_name: body.customer_name,
      phone: body.phone,
      address: body.address,
      construction_categories: JSON.stringify(categories),
      construction_categories_other: body.construction_categories_other || null,
      description: body.description,
      images: body.images || null,
      construction_value: constructionValue,
      design_submission_date: body.design_submission_date ? new Date(body.design_submission_date) : null,
      status: 'pending'
    },
    include: {
      sale_user: {
        select: { id: true, name: true }
      }
    }
  })

  await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'create',
      entity: 'customer_lead',
      entity_id: lead.id,
      new_data: JSON.stringify(lead)
    }
  })

  return lead
})
