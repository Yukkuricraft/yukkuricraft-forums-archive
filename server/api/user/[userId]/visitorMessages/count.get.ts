import { defineEventHandler } from 'h3'
import z from 'zod'

import { prismaKysely } from '#server/utils/db'
import { getUserVisitorMessagesCountQuery } from '#server/utils/queries/post'

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, z.object({ userId: z.coerce.number().pipe(z.int()) }).parse)
  const res = await getUserVisitorMessagesCountQuery(prismaKysely.$kysely, userId).execute()
  return { posts: Number(res[0].count) }
})
