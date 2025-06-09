import type { PrismaClient } from '@yukkuricraft-forums-archive/database'
import type { Logger } from 'winston'
import type { PrismaClientWithKysely } from './index.js'

declare module 'hono' {
  interface ContextVariableMap {
    prisma: PrismaClient
    prismaKysely: PrismaClientWithKysely
    logger: Logger
  }
}