import { defineEventHandler, createError } from 'h3'
import z from 'zod'

import { prisma } from '#server/utils/db'
import { userSelect } from '#shared/types/user'

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, z.object({ userId: z.coerce.number().pipe(z.int()) }).parse)

  const user = await prisma.user.findUnique({
    select: userSelect,
    where: {
      id: userId,
    },
  })

  if (user === null) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return user
})
