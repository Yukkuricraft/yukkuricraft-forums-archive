import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import type { PrismaClient } from '@yukkuricraft-forums-archive/database'

const app = new Hono()
  .get(
    '/core/image.php',
    zValidator('query', z.object({ userId: z.string(), thumb: z.string().pipe(z.coerce.number()).optional() })),
    (c) => {
      const { userId, thumb } = c.req.valid('query')
      return c.redirect(`/api/user/${userId}/avatar${thumb === 1 ? '/thumbnail' : ''}`)
    },
  )
  .get('/showthread.php', async (c) => {
    const prisma: PrismaClient = c.get('prisma')

    const obj = Object.entries(c.req.query())
    console.log(obj)
    if (obj.length === 0) {
      return c.notFound()
    }
    if (obj.length > 1) {
      c.status(400)
      return c.text('Bad request')
    }
    const k = obj![0]![0]
    const id = parseInt(k, 10) //We intentionally ignore the rest of the string here
    if (Number.isNaN(id)) {
      c.status(400)
      return c.text('Bad request')
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
      return c.notFound()
    }

    return c.redirect(`/${topic.Forum.FullSlug.slug.join('/')}/${id}-${topic.slug}`)
  })

export default app
