import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { getPostsQuery } from '@yukkuricraft-forums-archive/types/post'
import { ensureCanAccessTopic } from './auth.js'

const app = new Hono().get(
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
    await ensureCanAccessTopic(c, topicId)

    const res = await getPostsQuery(prisma.$kysely, topicId, q ?? '', pageSize, pageSize * (page - 1)).execute()

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
