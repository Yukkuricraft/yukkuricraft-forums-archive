import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
const adapter = new PrismaPg({
  connectionString: process.env.DB_URL,
})
const options = {
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'query', emit: 'stdout' },
  ],
  adapter,
}
const globalForPrisma = global
export const prisma = globalForPrisma.prisma || new PrismaClient(options)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
