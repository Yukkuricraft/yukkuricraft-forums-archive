import { defineEventHandler, createError } from 'h3'

import { getAuthInfo } from '#server/utils/auth'
import { prisma } from '#server/utils/db'

export default defineEventHandler(async (event) => {
  const authInfo = await getAuthInfo(event)
  if (!authInfo || !authInfo.userId) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  const userId = authInfo.userId
  const res = await prisma.topic.count({
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
  })

  return { count: res }
})
