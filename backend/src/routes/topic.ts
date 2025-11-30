import { PrismaClient, Prisma } from '@yukkuricraft-forums-archive/database'

import { type Context, Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { topicIncludeRequest, makeOutTopic } from '@yukkuricraft-forums-archive/types/topic'
import { ensureCanAccessForum, ensureCanAccessTopic } from './auth.js'

export function topicOrder(
  sortBy: 'dateLastUpdate' | 'dateStartedPost' | 'replies' | 'title' | 'members',
  order: 'asc' | 'desc',
) {
  // TODO: Handle members sortBy
  return {
    createdAt: sortBy === 'dateStartedPost' ? order : undefined,
    title: sortBy === 'title' ? order : undefined,
    postCount: sortBy === 'replies' ? order : undefined,
    LastPost:
      sortBy === 'dateLastUpdate'
        ? {
            Post: {
              createdAt: order,
            },
          }
        : undefined,
  } as const satisfies Prisma.TopicOrderByWithRelationInput
}

async function make404(c: Context, prisma: PrismaClient, parentId: number) {
  const forumExists = await prisma.forum.count({ where: { id: parentId } })
  if (forumExists > 0) {
    return c.json([])
  }

  return c.json({ error: 'not found' }, 404)
}

const app = new Hono()
  .get(
    'forums/:forumId/topics',
    zValidator(
      'query',
      z.object({
        page: z.string().pipe(z.coerce.number()).pipe(z.int().positive().min(1)).default(1),
        pageSize: z.string().pipe(z.coerce.number()).pipe(z.int().positive().max(30).min(1)).default(10),
        sortBy: z.enum(['dateLastUpdate', 'dateStartedPost', 'replies', 'title', 'members']).default('dateLastUpdate'),
        order: z.enum(['asc', 'desc']).default('desc'),
      }),
    ),
    zValidator('param', z.object({ forumId: z.string().pipe(z.coerce.number()).pipe(z.int()) })),
    async (c) => {
      const { page, sortBy, order, pageSize } = c.req.valid('query')
      const { forumId: parentId } = c.req.valid('param')
      await ensureCanAccessForum(c, parentId)

      const prisma: PrismaClient = c.get('prisma')
      const res = await prisma.topic.findMany({
        relationLoadStrategy: 'join',
        include: topicIncludeRequest,
        where: {
          sticky: false,
          forumId: parentId,
        },
        orderBy: topicOrder(sortBy, order),
        skip: pageSize * (page - 1),
        take: pageSize,
      })

      if (res.length === 0) {
        return await make404(c, prisma, parentId)
      }

      const result = res.map((row) => makeOutTopic(row))
      return c.json(result)
    },
  )
  .get(
    'forums/:forumId/stickyTopics',
    zValidator(
      'query',
      z.object({
        sortBy: z.enum(['dateLastUpdate', 'dateStartedPost', 'replies', 'title', 'members']).default('dateLastUpdate'),
        order: z.enum(['asc', 'desc']).default('desc'),
      }),
    ),
    zValidator('param', z.object({ forumId: z.string().pipe(z.coerce.number()).pipe(z.int()) })),
    async (c) => {
      const { sortBy, order } = c.req.valid('query')
      const { forumId: parentId } = c.req.valid('param')
      const prisma: PrismaClient = c.get('prisma')
      await ensureCanAccessForum(c, parentId)

      const res = await prisma.topic.findMany({
        relationLoadStrategy: 'join',
        include: topicIncludeRequest,
        where: {
          sticky: true,
          forumId: parentId,
        },
        orderBy: topicOrder(sortBy, order),
      })

      if (res.length === 0) {
        return await make404(c, prisma, parentId)
      }

      const result = res.map((row) => makeOutTopic(row))
      return c.json(result)
    },
  )
  .get(
    'topics/:topicId',
    zValidator('param', z.object({ topicId: z.string().pipe(z.coerce.number()).pipe(z.int()) })),
    async (c) => {
      const { topicId } = c.req.valid('param')
      const prisma: PrismaClient = c.get('prisma')
      await ensureCanAccessTopic(c, topicId)

      const res = await prisma.topic.findUnique({
        relationLoadStrategy: 'join',
        include: topicIncludeRequest,
        where: {
          id: topicId,
        },
      })

      if (res == null) {
        return c.json({ error: 'not found' }, 404)
      }

      const result = makeOutTopic(res)
      return c.json(result)
    },
  )

export default app
