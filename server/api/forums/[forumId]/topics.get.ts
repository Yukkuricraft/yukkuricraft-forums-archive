import { createError, defineEventHandler, getValidatedQuery } from 'h3'
import z from 'zod'

import { canSeeDeleted, ensureCanAccessForum } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { deletedTopicFilter, topicOrder } from '#server/utils/topicHelpers'
import { orderSchema, pageSchema, pageSizeSchema, sortBySchema } from '#server/utils/validation'
import { makeOutTopic, topicIncludeRequest } from '#shared/types/topic'

export default defineEventHandler(async (event) => {
  const { forumId: parentId } = await getValidatedRouterParams(
    event,
    z.object({ forumId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const { page, sortBy, order, pageSize } = await getValidatedQuery(
    event,
    z.object({
      page: pageSchema,
      pageSize: pageSizeSchema,
      sortBy: sortBySchema,
      order: orderSchema,
    }).parse,
  )
  const authInfo = await ensureCanAccessForum(event, parentId)

  const res = await prisma.topic.findMany({
    relationLoadStrategy: 'join',
    include: topicIncludeRequest,
    where: {
      sticky: false,
      forumId: parentId,
      ...deletedTopicFilter(authInfo),
    },
    orderBy: topicOrder(sortBy, order),
    skip: pageSize * (page - 1),
    take: pageSize,
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
