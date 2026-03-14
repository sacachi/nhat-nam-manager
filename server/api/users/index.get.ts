import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' }
  })
  
  // Exclude passwords
  return users.map(user => {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  })
})
