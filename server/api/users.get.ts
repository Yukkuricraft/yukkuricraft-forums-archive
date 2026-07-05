import { defineEventHandler } from 'h3'
import z from 'zod'

import { userSelect } from '#shared/types/user'

import { prisma } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { userId: userIds } = await getValidatedQuery(
    event,
    z.object({
      userId: z
        .array(z.coerce.number().pipe(z.int()))
        .nonempty()
        .or(
          z.coerce
            .number()
            .pipe(z.int())
            .transform((s) => [s]),
        ),
    }).parse,
  )

  return prisma.user.findMany({
    select: userSelect,
    where: {
      id: {
        in: userIds,
      },
    },
  })
})
