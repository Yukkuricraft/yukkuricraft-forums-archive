import { sendRedirect } from 'h3'

import type { AuthInfo } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { discordIdToUserId, discordIdAdmins, discordIdStaff } from '#server/utils/discordIds'

export default defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify', 'email'],
    authorizationParams: { prompt: 'none' },
  },
  async onSuccess(event, { user: discordUser }) {
    const matchConditions = []
    if (discordUser.verified && discordUser.email) {
      matchConditions.push({ email: discordUser.email as string })
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
