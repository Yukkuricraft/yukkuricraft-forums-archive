import { defineEventHandler, createError } from 'h3'

import { getAuthInfo } from '#server/utils/auth'
import { prisma } from '#server/utils/db'
import { userSelect } from '#shared/types/user'

export default defineEventHandler(async (event) => {
  const authInfo = await getAuthInfo(event)
  if (!authInfo) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }
  if (!authInfo.userId) {
    return { discordName: authInfo.discordName, isAdmin: authInfo.isAdmin, isStaff: authInfo.isStaff }
  }

  const user = await prisma.user.findUnique({
    relationLoadStrategy: 'join',
    where: { id: authInfo.userId },
    select: userSelect,
  })

  return { discordName: authInfo.discordName, user, isAdmin: authInfo.isAdmin, isStaff: authInfo.isStaff }
})
