import type { Prisma } from '@yukkuricraft-forums-archive/database'

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

export type User = Prisma.UserGetPayload<{ select: typeof userSelect }>
