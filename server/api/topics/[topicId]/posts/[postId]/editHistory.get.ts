import { defineEventHandler, createError } from 'h3'
import z from 'zod'

import { canSeeEditHistory, ensureCanAccessTopic } from '#server/utils/auth.js'
import { prisma } from '#server/utils/db'

export default defineEventHandler(async (event) => {
  const { topicId, postId } = await getValidatedRouterParams(
    event,
    z.object({ topicId: z.coerce.number().pipe(z.int()), postId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const authInfo = await ensureCanAccessTopic(event, topicId)

  if (!canSeeEditHistory(authInfo)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return prisma.postEditHistory.findMany({
    where: { postId, Post: { topicId } },
    orderBy: { id: 'asc' },
  })
})
