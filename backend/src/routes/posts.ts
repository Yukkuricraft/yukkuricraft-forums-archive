import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { getPostCountBeforeQuery, getPostsCountQuery, getPostsQuery } from '@yukkuricraft-forums-archive/types/post'
import { canSeeDeleted, canSeeEditHistory, ensureCanAccessTopic } from './auth.js'
import type { PrismaClient } from '@yukkuricraft-forums-archive/database'

const app = new Hono()
  .get(
    'topics/:topicId/posts',
    zValidator(
      'query',
      z.object({
        q: z.string().optional(),
        page: z.string().pipe(z.coerce.number()).pipe(z.int().positive().min(1)).default(1),
        pageSize: z.string().pipe(z.coerce.number()).pipe(z.int().positive().max(30)).default(10),
      }),
    ),
    zValidator('param', z.object({ topicId: z.string().pipe(z.coerce.number()).pipe(z.int()) })),
    async (c) => {
      const { page, q, pageSize } = c.req.valid('query')
      const { topicId } = c.req.valid('param')
      const prisma = c.get('prismaKysely')
      const authInfo = await ensureCanAccessTopic(c, topicId)
      const includeDeleted = canSeeDeleted(authInfo)

      const res = await getPostsQuery(
        prisma.$kysely,
        topicId,
        q ?? '',
        pageSize,
        pageSize * (page - 1),
        includeDeleted,
      ).execute()

      if (res.length === 0) {
        const topicExists = await prisma.topic.count({ where: { id: topicId } })
        if (topicExists) {
          return c.json([])
        }

        return c.json({ error: 'not found' }, 404)
      }

      return c.json(res)
    },
  )
  .get(
    'topics/:topicId/posts/count',
    zValidator(
      'query',
      z.object({
        q: z.string().optional(),
      }),
    ),
    zValidator('param', z.object({ topicId: z.string().pipe(z.coerce.number()).pipe(z.int()) })),
    async (c) => {
      const { q } = c.req.valid('query')
      const { topicId } = c.req.valid('param')
      const prisma = c.get('prismaKysely')
      const authInfo = await ensureCanAccessTopic(c, topicId)
      const includeDeleted = canSeeDeleted(authInfo)

      const res = await getPostsCountQuery(prisma.$kysely, topicId, q ?? '', includeDeleted).execute()
      return c.json({ posts: Number(res[0].count) })
    },
  )
  .get(
    'topics/:topicId/posts/:postId/page',
    zValidator(
      'query',
      z.object({
        pageSize: z.string().pipe(z.coerce.number()).pipe(z.int().positive().max(30)).default(10),
      }),
    ),
    zValidator(
      'param',
      z.object({
        topicId: z.string().pipe(z.coerce.number()).pipe(z.int()),
        postId: z.string().pipe(z.coerce.number()).pipe(z.int()),
      }),
    ),
    async (c) => {
      const { pageSize } = c.req.valid('query')
      const { topicId, postId } = c.req.valid('param')
      const prisma = c.get('prismaKysely')
      const authInfo = await ensureCanAccessTopic(c, topicId)
      const includeDeleted = canSeeDeleted(authInfo)

      const res = await getPostCountBeforeQuery(prisma.$kysely, topicId, postId, includeDeleted).execute()
      const position = Number(res[0].count)
      if (position === 0) {
        return c.json({ error: 'not found' }, 404)
      }

      return c.json({ page: Math.ceil(position / pageSize) })
    },
  )
  .get(
    'topics/:topicId/posts/:postId/editHistory',
    zValidator(
      'param',
      z.object({
        topicId: z.string().pipe(z.coerce.number()).pipe(z.int()),
        postId: z.string().pipe(z.coerce.number()).pipe(z.int()),
      }),
    ),
    async (c) => {
      const { topicId, postId } = c.req.valid('param')
      const prisma: PrismaClient = c.get('prisma')
      const authInfo = await ensureCanAccessTopic(c, topicId)

      if (!canSeeEditHistory(authInfo)) {
        return c.json({ error: 'forbidden' }, 403)
      }

      const res = await prisma.postEditHistory.findMany({
        where: { postId, Post: { topicId } },
        orderBy: { id: 'asc' },
      })
      return c.json(res)
    },
  )

export default app
