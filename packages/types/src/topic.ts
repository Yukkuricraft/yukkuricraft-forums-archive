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
  TopicTags: {
    select: {
      Tag: {
        select: {
          id: true,
          text: true,
        },
      },
    },
    orderBy: {
      Tag: {
        text: 'asc',
      },
    },
  },
  TopicPrivateMessage: {
    select: {
      User: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  Posts: {
    where: { PostPoll: { isNot: null } },
    select: {
      id: true,
      PostPoll: {
        select: {
          multiple: true,
          Options: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              title: true,
              Votes: {
                select: {
                  userId: true,
                  User: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies Prisma.TopicInclude

type PollPost = Prisma.TopicGetPayload<{ include: typeof topicIncludeRequest }>['Posts'][number]

function makeOutPoll(pollPost: PollPost | undefined, includeVoters: boolean) {
  const postPoll = pollPost?.PostPoll
  if (!pollPost || !postPoll) {
    return null
  }

  const options = postPoll.Options.map((opt) => ({
    id: opt.id,
    title: opt.title,
    voteCount: opt.Votes.length,
    voters: includeVoters ? opt.Votes.map((v) => ({ id: v.User.id, name: v.User.name })) : undefined,
  }))

  const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0)
  const totalVoters = new Set(postPoll.Options.flatMap((opt) => opt.Votes.map((v) => v.userId))).size

  return {
    postId: pollPost.id,
    multiple: postPoll.multiple,
    totalVotes,
    totalVoters,
    options,
  }
}

export function makeOutTopic(
  row: Prisma.TopicGetPayload<{ include: typeof topicIncludeRequest }>,
  includeVoters: boolean,
) {
  const oldTopic = row
  const newTopic = row.RedirectTo?.RedirectTo

  const topic = newTopic ?? oldTopic

  const lastPostSummary = {
    postId: topic.LastPost?.postId,
    at: topic.LastPost?.Post?.createdAt,
    userId: topic.LastPost?.Post?.creatorId,
  }

  const recipients = oldTopic.TopicPrivateMessage.map((pm) => ({
    id: pm.User.id,
    name: pm.User.name,
  }))

  const tags = oldTopic.TopicTags.map((tt) => ({
    id: tt.Tag.id,
    text: tt.Tag.text,
  }))

  const poll = makeOutPoll(oldTopic.Posts[0], includeVoters)

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
    recipients,
    tags,
    poll,
  }
}

export type Topic = ReturnType<typeof makeOutTopic>
