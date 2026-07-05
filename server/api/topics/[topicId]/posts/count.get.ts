import { defineEventHandler, getValidatedQuery } from 'h3'
import z from 'zod'

import { canSeeDeleted, ensureCanAccessTopic } from '#server/utils/auth.js'
import { prismaKysely } from '#server/utils/db.js'
import { getPostsCountQuery } from '#server/utils/queries/post.js'

const querySchema = z.object({
  q: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { topicId } = await getValidatedRouterParams(
    event,
    z.object({ topicId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const { q } = await getValidatedQuery(event, (d) => querySchema.parse(d))
  const authInfo = await ensureCanAccessTopic(event, topicId)
  const includeDeleted = canSeeDeleted(authInfo)

  const res = await getPostsCountQuery(prismaKysely.$kysely, topicId, q ?? '', includeDeleted).execute()
  return { posts: Number(res[0].count) }
})
