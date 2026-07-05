import { defineEventHandler, createError } from 'h3'
import z from 'zod'

import { canAccessForum, canAccessTopicRecord, canSeeDeleted, getAuthInfo } from '#server/utils/auth'
import { prisma } from '#server/utils/db'

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

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({ id: z.coerce.number().pipe(z.int()) }).parse)
  const authInfo = await getAuthInfo(event)

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
    return { forum: { forumSlug: forumRes.FullSlug?.slug } }
  }

  if (topicRes && canAccessTopicRecord(authInfo, topicRes)) {
    return {
      topic: { forumSlug: topicRes.Forum.FullSlug?.slug, topicSlug: topicRes.slug, topicId: topicRes.id },
    }
  }

  const postVisible =
    postRes &&
    canAccessTopicRecord(authInfo, postRes.Topic) &&
    ((postRes.deletedAt == null && !postRes.hidden) || canSeeDeleted(authInfo))
  if (postVisible) {
    return {
      post: {
        forumSlug: postRes.Topic.Forum.FullSlug?.slug,
        topicSlug: postRes.Topic.slug,
        topicId: postRes.Topic.id,
        postIdx: postRes.PostIdx!.idx,
        postId: postRes.id,
      },
    }
  }

  throw createError({ statusCode: 404, statusMessage: 'Not found' })
})
