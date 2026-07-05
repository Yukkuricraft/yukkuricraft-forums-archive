import type { SerializeObject } from 'nitropack/types'
import type { Prisma } from '~~/generated/prisma/client'

export const userSelect = {
  id: true,
  userGroupId: true,
  slug: true,
  name: true,
  title: true,
  titleColor: true,
  titleOpacity: true,
  createdAt: true,
  postCount: true,
  signature: true,
  avatarId: true,
  biography: true,
  location: true,
  interests: true,
  occupation: true,
  inGameName: true,
  UserGroup: {
    select: {
      userTitle: true,
      color: true,
    },
  },
} satisfies Prisma.UserSelect

export type User = SerializeObject<Prisma.UserGetPayload<{ select: typeof userSelect }>>
