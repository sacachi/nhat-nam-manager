import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { SALE_ROLES } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)

  const where: any = {}
  
  if (query.status) {
    where.status = query.status as string
  }

  if (user.role === 'Sale' || SALE_ROLES.includes(user.role)) {
    where.sale_user_id = user.id
  } else if (user.role === 'Design') {
    where.designer_id = user.id
  }

  const leads = await prisma.customerLead.findMany({
    where,
    include: {
      sale_user: {
        select: { id: true, name: true }
      },
      designer: {
        select: { id: true, name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return leads.map(lead => ({
    ...lead,
    sale_name: lead.sale_user.name,
    designer_name: lead.designer?.name || null
  }))
})
