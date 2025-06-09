import type { Prisma } from '@yukkuricraft-forums-archive/database'

export const lastPostInclude = {
  include: {
    Post: {
      select: {
        createdAt: true,
        creatorId: true,
      },
    },
  },
} as const satisfies Prisma.Topic$LastPostArgs

export const topicIncludeRequest = {
  RedirectTo: {
    include: {
      RedirectTo: {
        include: {
          LastPost: lastPostInclude,
        },
      },
    },
  },
  LastPost: lastPostInclude,
} as const satisfies Prisma.TopicInclude

export function makeOutTopic(row: Prisma.TopicGetPayload<{ include: typeof topicIncludeRequest }>) {
  const oldTopic = row
  const newTopic = row.RedirectTo?.RedirectTo

  const topic = newTopic ?? oldTopic

  const lastPostSummary = {
    postId: topic.LastPost?.postId,
    at: topic.LastPost?.Post?.createdAt,
    userId: topic.LastPost?.Post?.creatorId,
  }

  let redirectTo
  if (newTopic) {
    redirectTo = {
      id: newTopic.id,
      forumId: newTopic.forumId,
      creatorId: newTopic.creatorId,
      createdAt: newTopic.createdAt,
      slug: newTopic.slug,
      title: newTopic.title,
      sticky: newTopic.sticky,
      deletedAt: newTopic.deletedAt,
      hidden: newTopic.hidden,
      postCount: newTopic.postCount,
      lastPostSummary,
    }
  }

  return {
    id: oldTopic.id,
    forumId: oldTopic.forumId,
    creatorId: oldTopic.creatorId,
    createdAt: oldTopic.createdAt,
    slug: oldTopic.slug,
    title: oldTopic.title,
    sticky: oldTopic.sticky,
    deletedAt: oldTopic.deletedAt,
    hidden: oldTopic.hidden,
    postCount: oldTopic.postCount,
    redirectTo,
    lastPostSummary,
  }
}

export type Topic = ReturnType<typeof makeOutTopic>
