import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      receipts: { orderBy: { date: 'desc' } },
      expenses: { orderBy: { date: 'desc' } }
    }
  })

  if (!project) throw createError({ statusCode: 404, statusMessage: 'Project not found' })

  return project
})
