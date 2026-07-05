import { createError, defineEventHandler, getValidatedQuery } from 'h3'
import z from 'zod'

import { canSeeDeleted, ensureCanAccessTopic } from '#server/utils/auth.js'
import { prisma, prismaKysely } from '#server/utils/db'
import { getPostsQuery } from '#server/utils/queries/post.js'
import { pageSchema } from '#server/utils/validation.js'

export default defineEventHandler(async (event) => {
  const { topicId } = await getValidatedRouterParams(
    event,
    z.object({ topicId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const { page, q, pageSize } = await getValidatedQuery(
    event,
    z.object({
      q: z.string().optional(),
      page: pageSchema,
      pageSize: z.coerce.number().pipe(z.int().positive().max(30)).default(10),
    }).parse,
  )
  const authInfo = await ensureCanAccessTopic(event, topicId)
  const includeDeleted = canSeeDeleted(authInfo)

  const res = await getPostsQuery(
    prismaKysely.$kysely,
    topicId,
    q ?? '',
    pageSize,
    pageSize * (page - 1),
    includeDeleted,
  ).execute()

  if (res.length === 0) {
    const topicExists = await prisma.topic.count({ where: { id: topicId } })
    if (topicExists) {
      return []
    }
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return res
})
