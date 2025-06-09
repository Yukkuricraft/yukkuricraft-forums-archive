import { PrismaClient, type Prisma } from "../generated/prisma/index.js";

const options = {
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'query', emit: 'stdout' },
  ],
} satisfies Prisma.PrismaClientOptions

const globalForPrisma = global as unknown as { prisma: PrismaClient<typeof options, 'error' | 'warn'> };

export const prisma =
  globalForPrisma.prisma || new PrismaClient(options);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;