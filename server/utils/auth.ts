import { H3Event } from 'h3'

export const getAuthUser = (event: H3Event) => {
  const user = event.context.user
  if (!user || !user.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}
