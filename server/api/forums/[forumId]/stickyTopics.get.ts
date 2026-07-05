import { defineEventHandler, getValidatedQuery, createError } from 'h3'
import z from 'zod'

import { canSeeDeleted, ensureCanAccessForum } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { deletedTopicFilter, topicOrder } from '#server/utils/topicHelpers'
import { orderSchema, sortBySchema } from '#server/utils/validation'
import { makeOutTopic, topicIncludeRequest } from '#shared/types/topic'

const querySchema = z.object({
  sortBy: sortBySchema,
  order: orderSchema,
})

export default defineEventHandler(async (event) => {
  const { forumId: parentId } = await getValidatedRouterParams(
    event,
    z.object({ forumId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const { sortBy, order } = await getValidatedQuery(event, (d) => querySchema.parse(d))
  const authInfo = await ensureCanAccessForum(event, parentId)

  const res = await prisma.topic.findMany({
    relationLoadStrategy: 'join',
    include: topicIncludeRequest,
    where: {
      sticky: true,
      forumId: parentId,
      ...deletedTopicFilter(authInfo),
    },
    orderBy: topicOrder(sortBy, order),
  })

  if (res.length === 0) {
    const forumExists = await prisma.forum.count({ where: { id: parentId } })
    if (forumExists > 0) {
      return []
    }
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return res.map((row) => makeOutTopic(row, canSeeDeleted(authInfo)))
})
