import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/auth'
import { maskPhone } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)

  const customers = await prisma.customer.findMany({
    orderBy: { created_at: 'desc' }
  })

  return customers.map(customer => ({
    ...customer,
    phone: maskPhone(customer.phone, user.role)
  }))
})
