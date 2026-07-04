import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { PrismaClient } from '@yukkuricraft-forums-archive/database'
import { canAccessForum, canAccessTopicRecord, canSeeDeleted, getAuthInfo } from './auth.js'

const topicVisibilitySelect = {
  id: true,
  slug: true,
  deletedAt: true,
  hidden: true,
  creatorId: true,
  Forum: {
    select: {
      requiresAdmin: true,
      requiresStaff: true,
      FullSlug: { select: { slug: true } },
    },
  },
  TopicPrivateMessage: { select: { sentTo: true } },
} as const

const app = new Hono().get(
  'unknownObject/:id',
  zValidator('param', z.object({ id: z.string().pipe(z.coerce.number()).pipe(z.int()) })),
  async (c) => {
    const { id } = c.req.valid('param')
    const prisma: PrismaClient = c.get('prisma')
    const authInfo = await getAuthInfo(c)

    const forumQuery = prisma.forum.findUnique({
      select: {
        requiresAdmin: true,
        requiresStaff: true,
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
      select: topicVisibilitySelect,
      where: {
        id,
      },
    })
    const postQuery = prisma.post.findUnique({
      select: {
        id: true,
        deletedAt: true,
        hidden: true,
        Topic: {
          select: topicVisibilitySelect,
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

    if (forumRes && canAccessForum(authInfo, forumRes)) {
      return c.json({ forum: { forumSlug: forumRes.FullSlug?.slug } })
    }

    if (topicRes && canAccessTopicRecord(authInfo, topicRes)) {
      return c.json({
        topic: { forumSlug: topicRes.Forum.FullSlug?.slug, topicSlug: topicRes.slug, topicId: topicRes.id },
      })
    }

    const postVisible =
      postRes &&
      canAccessTopicRecord(authInfo, postRes.Topic) &&
      ((postRes.deletedAt == null && !postRes.hidden) || canSeeDeleted(authInfo))
    if (postVisible) {
      return c.json({
        post: {
          forumSlug: postRes.Topic.Forum.FullSlug?.slug,
          topicSlug: postRes.Topic.slug,
          topicId: postRes.Topic.id,
          postIdx: postRes.PostIdx!.idx,
          postId: postRes.id,
        },
      })
    }

    return c.json({ error: 'not found' }, 404)
  },
)

export default app
