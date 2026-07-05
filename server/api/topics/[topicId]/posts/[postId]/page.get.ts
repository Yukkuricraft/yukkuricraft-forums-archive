import { defineEventHandler, getValidatedQuery, createError } from 'h3'
import z from 'zod'

import { canSeeDeleted, ensureCanAccessTopic } from '#server/utils/auth.js'
import { prismaKysely } from '#server/utils/db.js'
import { getPostCountBeforeQuery } from '#server/utils/queries/post.js'

const querySchema = z.object({
  pageSize: z.string().pipe(z.coerce.number()).pipe(z.int().positive().max(30)).default(10),
})

export default defineEventHandler(async (event) => {
  const { topicId, postId } = await getValidatedRouterParams(
    event,
    z.object({ topicId: z.coerce.number().pipe(z.int()), postId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const { pageSize } = await getValidatedQuery(event, (d) => querySchema.parse(d))
  const authInfo = await ensureCanAccessTopic(event, topicId)
  const includeDeleted = canSeeDeleted(authInfo)

  const res = await getPostCountBeforeQuery(prismaKysely.$kysely, topicId, postId, includeDeleted).execute()
  const position = Number(res[0].count)
  if (position === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return { page: Math.ceil(position / pageSize) }
})
