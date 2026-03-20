import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const designers = await prisma.user.findMany({
    where: { role: 'Design', status: 'active' },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { name: 'asc' }
  })

  return designers
})
