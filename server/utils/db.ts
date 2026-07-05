import { PrismaPg } from '@prisma/adapter-pg'
import { CamelCasePlugin, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely'
import kyselyExtension from 'prisma-extension-kysely'
import type { DB } from '~~/generated/kysely/types.js'
import { PrismaClient } from '~~/generated/prisma/client.js'

const prismaClientSingleton = () => {
  const pool = new PrismaPg({ connectionString: process.env.DB_URL! })
  return new PrismaClient({ adapter: pool })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
  prismaKysely: ReturnType<typeof makePrismaKysely> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

function makePrismaKysely() {
  return prisma.$extends(
    kyselyExtension({
      kysely: (driver) =>
        new Kysely<DB>({
          dialect: {
            createDriver: () => driver,
            createAdapter: () => new PostgresAdapter(),
            createIntrospector: (db) => new PostgresIntrospector(db),
            createQueryCompiler: () => new PostgresQueryCompiler(),
          },
          plugins: [new CamelCasePlugin()],
        }),
    }),
  )
}

export const prismaKysely = globalForPrisma.prismaKysely ?? makePrismaKysely()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaKysely = prismaKysely

export type PrismaClientWithKysely = typeof prismaKysely
