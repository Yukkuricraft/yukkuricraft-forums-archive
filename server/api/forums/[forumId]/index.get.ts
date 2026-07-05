import { defineEventHandler, createError } from 'h3'
import z from 'zod'

import { ensureCanAccessForum } from '#server/utils/auth'
import { prisma } from '#server/utils/db'

export default defineEventHandler(async (event) => {
  const { forumId: parentId } = await getValidatedRouterParams(
    event,
    z.object({ forumId: z.coerce.number().pipe(z.int()) }).parse,
  )
  const userInfo = await ensureCanAccessForum(event, parentId)

  const forums = await prisma.forum.findMany({
    where: {
      AND: [
        {
          requiresAdmin: userInfo?.isAdmin ? undefined : false,
          requiresStaff: userInfo?.isStaff ? undefined : false,
        },
        { OR: [{ parentId }, { id: parentId }] },
      ],
    },
  })

  const parent = forums.find((f) => f.id === parentId)
  const children = forums.filter((f) => f.parentId === parentId)

  if (!parent && children.length > 0) {
    throw new Error(`Found children without parent. Children: ${JSON.stringify(children)}`)
  }

  if (!parent) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  children.sort((a, b) => a.displayorder - b.displayorder)

  return { ...parent, subForums: children }
})
