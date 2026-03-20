import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { maskPhone } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ' })

  const canViewFinance = ['Admin', 'Sale'].includes(user.role)
  const isConstruction = user.role === 'Construction'

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      receipts: { orderBy: { date: 'desc' } },
      expenses: { orderBy: { date: 'desc' } }
    }
  })

  if (!project) throw createError({ statusCode: 404, statusMessage: 'Công trình không tồn tại' })

  if (project.customer) {
    project.customer = {
      ...project.customer,
      phone: maskPhone(project.customer.phone, user.role)
    }
  }

  if (!canViewFinance) {
    project.contract_value = null as any
    project.receipts = []
  }

  if (!canViewFinance && isConstruction) {
    project.expenses = project.expenses.filter(e => e.created_by === user.id)
  } else if (!canViewFinance) {
    project.expenses = []
  }

  return project
})
