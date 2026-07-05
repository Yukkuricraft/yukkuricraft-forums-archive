import { defineEventHandler, getQuery, createError, sendRedirect } from 'h3'

import { prisma } from '../utils/db'

export default defineEventHandler(async (event) => {
  // Legacy vBulletin links look like /showthread.php?12345-Topic-Title — the topic id is the
  // (valueless) query key. We intentionally ignore the rest of the string.
  const obj = Object.entries(getQuery(event))
  if (obj.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  if (obj.length > 1) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  }
  const k = obj[0][0]
  const id = parseInt(k, 10)
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  }

  const topic = await prisma.topic.findUnique({
    where: {
      id,
    },
    select: {
      slug: true,
      Forum: {
        select: {
          FullSlug: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  })

  if (!topic || !topic.Forum.FullSlug) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return sendRedirect(event, `/${topic.Forum.FullSlug.slug.join('/')}/${id}-${topic.slug}`)
})
