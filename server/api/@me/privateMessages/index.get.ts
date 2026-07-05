import { createError, defineEventHandler, getValidatedQuery } from 'h3'
import z from 'zod'

import { canSeeDeleted, getAuthInfo } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { topicOrder } from '#server/utils/topicHelpers'
import { orderSchema, pageSchema, pageSizeSchema, sortBySchema } from '#server/utils/validation'
import { makeOutTopic, topicIncludeRequest } from '#shared/types/topic'

export default defineEventHandler(async (event) => {
  const authInfo = await getAuthInfo(event)
  if (!authInfo || !authInfo.userId) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }
  const { page, sortBy, order, pageSize } = await getValidatedQuery(
    event,
    z.object({
      page: pageSchema,
      pageSize: pageSizeSchema,
      sortBy: sortBySchema,
      order: orderSchema,
    }).parse,
  )

  const userId = authInfo.userId
  const res = await prisma.topic.findMany({
    relationLoadStrategy: 'join',
    include: topicIncludeRequest,
    where: {
      forumId: 8,
      OR: [
        {
          creatorId: userId,
        },
        {
          TopicPrivateMessage: {
            some: {
              sentTo: userId,
            },
          },
        },
      ],
    },
    orderBy: topicOrder(sortBy, order),
    skip: pageSize * (page - 1),
    take: pageSize,
  })

  return res.map((row) => makeOutTopic(row, canSeeDeleted(authInfo)))
})
