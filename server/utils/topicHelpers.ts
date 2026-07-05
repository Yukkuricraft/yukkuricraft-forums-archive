import type { Prisma } from '~~/generated/prisma/client.js'

import { type AuthInfo, canSeeDeleted } from './auth'

export type TopicSortBy = 'dateLastUpdate' | 'dateStartedPost' | 'replies' | 'title' | 'members'

export function deletedTopicFilter(authInfo: AuthInfo | null): Prisma.TopicWhereInput {
  return canSeeDeleted(authInfo) ? {} : { deletedAt: null, hidden: false }
}

export function topicOrder(sortBy: TopicSortBy, order: 'asc' | 'desc') {
  return {
    createdAt: sortBy === 'dateStartedPost' ? order : undefined,
    title: sortBy === 'title' ? order : undefined,
    postCount: sortBy === 'replies' ? order : undefined,
    memberCount: sortBy === 'members' ? order : undefined,
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
