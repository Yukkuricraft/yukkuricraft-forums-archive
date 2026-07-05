import { sendRedirect } from 'h3'

import type { AuthInfo } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { discordIdToUserId, discordIdAdmins, discordIdStaff } from '#server/utils/discordIds'
import z from 'zod'

const discordUserSchema = z.object({
  id: z.string(),
  verified: z.boolean(),
  email: z.string().nullish(),
  global_name: z.string().nullable(),
  username: z.string(),
})

export default defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify', 'email'],
    authorizationParams: { prompt: 'none' },
  },
  async onSuccess(event, { user: rawDiscordUser }) {
    const discordUser = discordUserSchema.parse(rawDiscordUser)

    const matchConditions = []
    if (discordUser.verified && discordUser.email) {
      matchConditions.push({ email: discordUser.email })
    }
    const mapping = discordIdToUserId[discordUser.id]
    if (mapping && !isNaN(mapping)) {
      matchConditions.push({ id: mapping })
    }

    const user =
      matchConditions.length > 0
        ? await prisma.user.findFirst({
            select: {
              id: true,
              name: true,
            },
            where: { OR: matchConditions },
          })
        : null

    await setUserSession(event, {
      user: {
        discordName: discordUser.global_name ?? discordUser.username,
        userId: user?.id ?? null,
        userName: user?.name ?? '',
        isStaff: discordIdStaff.includes(discordUser.id),
        isAdmin: discordIdAdmins.includes(discordUser.id),
      } satisfies AuthInfo,
    })

    return sendRedirect(event, '/')
  },
})
