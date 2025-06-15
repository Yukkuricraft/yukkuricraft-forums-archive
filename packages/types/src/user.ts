import type { Prisma } from '@yukkuricraft-forums-archive/database'

export const userInclude = {
  UserGroup: {
    select: {
      userTitle: true,
      color: true,
    },
  },
} satisfies Prisma.UserInclude

export type User = Prisma.UserGetPayload<{ include: typeof userInclude }>
