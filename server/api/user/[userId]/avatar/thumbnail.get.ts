import { create as createContentDisposition } from 'content-disposition'
import { defineEventHandler, createError, setResponseHeaders } from 'h3'
import mime from 'mime-types'
import z from 'zod'

import { prisma } from '#server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, z.object({ userId: z.coerce.number().pipe(z.int()) }).parse)
  const user = await prisma.user.findUnique({
    select: {
      Avatar: {
        select: {
          filename: true,
          thumbnailData: true,
          extension: true,
        },
      },
    },
    where: {
      id: userId,
    },
  })

  if (user === null || user.Avatar === null || user.Avatar.thumbnailData === null) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  setResponseHeaders(event, {
    'content-type': mime.contentType(user.Avatar.filename) || 'application/octet-stream',
    'content-disposition': createContentDisposition(user.Avatar.filename, { type: 'inline' }),
  })
  return Buffer.from(user.Avatar.thumbnailData)
})
