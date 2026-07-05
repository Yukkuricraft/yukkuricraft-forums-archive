import { createError, defineEventHandler, getValidatedQuery } from 'h3'
import z from 'zod'

import { prisma, prismaKysely } from '#server/utils/db'
import { getUserVisitorMessagesQuery } from '#server/utils/queries/post.js'
import { pageSchema } from '#server/utils/validation.js'

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, z.object({ userId: z.coerce.number().pipe(z.int()) }).parse)
  const { page, pageSize } = await getValidatedQuery(
    event,
    z.object({
      page: pageSchema,
      pageSize: z.coerce.number().pipe(z.int().positive().max(30)).default(10),
    }).parse,
  )

  const res = await getUserVisitorMessagesQuery(prismaKysely.$kysely, userId, pageSize, pageSize * (page - 1)).execute()

  if (res.length === 0) {
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (userExists) {
      return []
    }
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return res
})
