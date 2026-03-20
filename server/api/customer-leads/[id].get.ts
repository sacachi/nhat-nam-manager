import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { SALE_ROLES } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  const lead = await prisma.customerLead.findUnique({
    where: { id },
    include: {
      sale_user: {
        select: { id: true, name: true }
      }
    }
  })

  if (!lead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
  }

  if (SALE_ROLES.includes(user.role) && lead.sale_user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Không có quyền truy cập lead này' })
  }

  return {
    ...lead,
    sale_name: lead.sale_user.name
  }
})
