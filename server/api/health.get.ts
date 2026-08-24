import { defineEventHandler } from 'h3'

import { prisma } from '#server/utils/db.js'

export default defineEventHandler(async () => {
  await prisma.$queryRaw`SELECT 1`
  return { status: 'ok' }
})
