import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { PrismaClient } from '@yukkuricraft-forums-archive/database'
import AppError from '../AppError.js'

const app = new Hono().get(
  'unknownObject/:id',
  zValidator('param', z.object({ id: z.string().pipe(z.coerce.number().int()) })),
  async (c) => {
    const { id } = c.req.valid('param')
    const prisma: PrismaClient = c.get('prisma')

    const forumQuery = prisma.forum.findUnique({
      select: {
        FullSlug: {
          select: {
            slug: true,
          },
        },
      },
      where: {
        id,
      },
    })
    const topicQuery = prisma.topic.findUnique({
      select: {
        id: true,
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
      where: {
        id,
      },
    })
    const postQuery = prisma.post.findUnique({
      select: {
        id: true,
        Topic: {
          select: {
            id: true,
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
        },
        PostIdx: {
          select: {
            idx: true,
          },
        },
      },
      where: {
        id,
      },
    })

    const [forumRes, topicRes, postRes] = await Promise.all([forumQuery, topicQuery, postQuery])
    if (!forumRes && !topicRes && !postRes) {
      return c.json({ errror: 'not found' }, 404)
    }

    if (forumRes) {
      return c.json({ forum: { forumSlug: forumRes?.FullSlug?.slug } })
    }

    if (topicRes) {
      return c.json({ topic: { forumSlug: topicRes.Forum.FullSlug?.slug, topicSlug: topicRes.slug } })
    }

    if (postRes) {
      return c.json({
        post: {
          forumSlug: postRes.Topic.Forum.FullSlug?.slug,
          topicSlug: postRes.Topic.slug,
          idx: postRes.PostIdx!.idx,
        },
      })
    }

    throw new AppError('Not possible', false)
  },
)

export default app
