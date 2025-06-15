import { PrismaClient } from '../generated/prisma/index.js'
const options = {
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'query', emit: 'stdout' },
  ],
}
const globalForPrisma = global
export const prisma = globalForPrisma.prisma || new PrismaClient(options)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
