import { type H3Event, createError } from 'h3'

import { prisma } from './db'

export interface AuthInfo {
  discordName: string
  userId: number | null
  userName: string
  isAdmin: boolean
  isStaff: boolean
}

// The AuthInfo is stored as the nuxt-auth-utils session `user`.
declare module '#auth-utils' {
  interface User extends AuthInfo {}
}

export async function getAuthInfo(event: H3Event): Promise<AuthInfo | null> {
  const session = await getUserSession(event)
  return session.user ?? null
}

export function canAccessForum(authInfo: AuthInfo | null, forum: { requiresStaff: boolean; requiresAdmin: boolean }) {
  return (!forum.requiresStaff || authInfo?.isStaff) && (!forum.requiresAdmin || authInfo?.isAdmin)
}

export function canSeeDeleted(authInfo: AuthInfo | null): boolean {
  return Boolean(authInfo?.isStaff || authInfo?.isAdmin)
}

export function canSeeEditHistory(authInfo: AuthInfo | null): boolean {
  return Boolean(authInfo?.isStaff || authInfo?.isAdmin)
}

/**
 * Whether the given viewer is allowed to see this topic at all. Mirrors the checks in
 * {@link ensureCanAccessTopic} (forum permissions, PM membership, deleted/hidden), but returns
 * a boolean instead of throwing so callers can silently omit inaccessible topics.
 */
export function canAccessTopicRecord(
  authInfo: AuthInfo | null,
  topic: {
    deletedAt: Date | null
    hidden: boolean
    creatorId: number | null
    Forum: { requiresStaff: boolean; requiresAdmin: boolean }
    TopicPrivateMessage: { sentTo: number }[]
  },
): boolean {
  const isPm = topic.TopicPrivateMessage.length > 0
  const isMemberOfPm =
    topic.creatorId === authInfo?.userId || topic.TopicPrivateMessage.some((pm) => pm.sentTo === authInfo?.userId)

  if (!canAccessForum(authInfo, topic.Forum) && (!isPm || !isMemberOfPm)) {
    return false
  }

  if ((topic.deletedAt != null || topic.hidden) && !canSeeDeleted(authInfo)) {
    return false
  }

  return true
}

export async function ensureCanAccessForum(event: H3Event, forumId: number): Promise<AuthInfo | null> {
  const authInfo = await getAuthInfo(event)
  const forum = await prisma.forum.findUnique({
    select: {
      requiresAdmin: true,
      requiresStaff: true,
    },
    where: {
      id: forumId,
    },
  })

  // We let the route handle the missing entity
  if (forum === null) {
    return authInfo
  }

  if (!canAccessForum(authInfo, forum)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return authInfo
}

export async function ensureCanAccessTopic(event: H3Event, topicId: number): Promise<AuthInfo | null> {
  const authInfo = await getAuthInfo(event)
  const topic = await prisma.topic.findUnique({
    include: {
      Forum: {
        select: {
          requiresAdmin: true,
          requiresStaff: true,
        },
      },
      TopicPrivateMessage: {
        select: {
          sentTo: true,
        },
      },
    },
    where: {
      id: topicId,
    },
  })

  // We let the route handle the missing entity
  if (topic === null) {
    return authInfo
  }

  const isPm = topic.TopicPrivateMessage.length > 0
  const isMemberOfPm =
    topic.creatorId === authInfo?.userId || topic.TopicPrivateMessage.some((pm) => pm.sentTo === authInfo?.userId)

  if (!canAccessForum(authInfo, topic.Forum) && (!isPm || !isMemberOfPm)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if ((topic.deletedAt != null || topic.hidden) && !canSeeDeleted(authInfo)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return authInfo
}
