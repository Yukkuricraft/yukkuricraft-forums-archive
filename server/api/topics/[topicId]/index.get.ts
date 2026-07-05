import { defineEventHandler, createError } from 'h3'
import z from 'zod'

import { canSeeDeleted, ensureCanAccessTopic } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { makeOutTopic, topicIncludeRequest } from '#shared/types/topic'

export default defineEventHandler(async (event) => {
  const { topicId } = await getValidatedRouterParams(
    event,
    z.object({ topicId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const authInfo = await ensureCanAccessTopic(event, topicId)

  const res = await prisma.topic.findUnique({
    relationLoadStrategy: 'join',
    include: topicIncludeRequest,
    where: {
      id: topicId,
    },
  })

  if (res == null) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return makeOutTopic(res, canSeeDeleted(authInfo))
})
