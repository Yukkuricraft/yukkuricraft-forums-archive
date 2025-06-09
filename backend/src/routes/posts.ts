import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import type { PrismaClient } from '@yukkuricraft-forums-archive/database'
import { getPosts } from '@yukkuricraft-forums-archive/database/sql'

export type Post = getPosts.Result

const app = new Hono().get(
  'topics/:topicId/posts',
  zValidator(
    'query',
    z.object({
      q: z.string().optional(),
      page: z.string().pipe(z.coerce.number().int().positive().min(1)).default('1'),
      pageSize: z.string().pipe(z.coerce.number().int().positive().max(30).min(1)).default('10'),
    }),
  ),
  zValidator('param', z.object({ topicId: z.string().pipe(z.coerce.number().int()) })),
  async (c) => {
    const { page, q, pageSize } = c.req.valid('query')
    const { topicId } = c.req.valid('param')
    const prisma: PrismaClient = c.get('prisma')

    const res = await prisma.$queryRawTyped(getPosts(topicId, q ?? '', pageSize, pageSize * (page - 1)))

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

export default app
